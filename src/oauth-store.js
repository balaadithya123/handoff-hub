import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;
const CODE_TTL_SECONDS = 5 * 60;

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const randomToken = (prefix, bytes = 32) => `${prefix}${crypto.randomBytes(bytes).toString('hex')}`;
const inSeconds = s => new Date(Date.now() + s * 1000).toISOString();
const nowIso = () => new Date().toISOString();

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} failed: ${r.status}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

export async function createClient({ client_name, redirect_uris }) {
  const client_id = randomToken('hhc_', 16);
  await rest('oauth_clients', { method: 'POST', prefer: 'return=minimal', body: { client_id, client_name: client_name || null, redirect_uris } });
  return { client_id, client_name: client_name || null, redirect_uris };
}

export async function countClients() {
  const rows = await rest('oauth_clients?select=client_id', { prefer: 'count=exact' });
  return Array.isArray(rows) ? rows.length : 0;
}

export async function getClient(client_id) {
  if (!client_id || typeof client_id !== 'string') return null;
  const rows = await rest(`oauth_clients?client_id=eq.${encodeURIComponent(client_id)}&select=client_id,client_name,redirect_uris,created_at`);
  return rows?.[0] ?? null;
}

export async function createAuthCode({ client_id, user_id, redirect_uri, code_challenge }) {
  const code = randomToken('hhcode_');
  await rest('oauth_codes', { method: 'POST', prefer: 'return=minimal', body: { code_hash: sha256(code), client_id, user_id, redirect_uri, code_challenge, expires_at: inSeconds(CODE_TTL_SECONDS) } });
  return code;
}

export async function consumeAuthCode(code) {
  if (!code || typeof code !== 'string') return null;
  const rows = await rest(`oauth_codes?code_hash=eq.${sha256(code)}&used=eq.false&expires_at=gt.${encodeURIComponent(nowIso())}`, { method: 'PATCH', prefer: 'return=representation', body: { used: true } });
  return rows?.[0] ?? null;
}

export async function issueTokens({ client_id, user_id }) {
  const access_token = randomToken('hho_');
  const refresh_token = randomToken('hhr_');
  await rest('oauth_tokens', { method: 'POST', prefer: 'return=minimal', body: [
    { token_hash: sha256(access_token), kind: 'access', client_id, user_id, expires_at: inSeconds(ACCESS_TTL_SECONDS) },
    { token_hash: sha256(refresh_token), kind: 'refresh', client_id, user_id, expires_at: inSeconds(REFRESH_TTL_SECONDS) }
  ] });
  return { access_token, token_type: 'Bearer', expires_in: ACCESS_TTL_SECONDS, refresh_token, scope: 'hub' };
}

export async function rotateRefreshToken(refresh_token, client_id) {
  if (!refresh_token || typeof refresh_token !== 'string') return null;
  const rows = await rest(`oauth_tokens?token_hash=eq.${sha256(refresh_token)}&kind=eq.refresh&revoked=eq.false&client_id=eq.${encodeURIComponent(client_id)}&expires_at=gt.${encodeURIComponent(nowIso())}`, { method: 'PATCH', prefer: 'return=representation', body: { revoked: true } });
  const row = rows?.[0];
  return row ? issueTokens({ client_id, user_id: row.user_id }) : null;
}

export async function userIdFromAccessToken(token) {
  if (!SUPABASE_URL || !SERVICE_KEY || !token) return null;
  try {
    const rows = await rest(`oauth_tokens?token_hash=eq.${sha256(token)}&kind=eq.access&revoked=eq.false&expires_at=gt.${encodeURIComponent(nowIso())}&select=user_id`);
    return rows?.[0]?.user_id ?? null;
  } catch { return null; }
}

export async function listOAuthClients(user_id) {
  const rows = await rest(`oauth_clients?select=client_id,client_name,created_at&order=created_at.desc`);
  const tokens = await rest(`oauth_tokens?user_id=eq.${encodeURIComponent(user_id)}&revoked=eq.false&expires_at=gt.${encodeURIComponent(nowIso())}&select=client_id`);
  const counts = new Map();
  for (const t of tokens || []) counts.set(t.client_id, (counts.get(t.client_id) || 0) + 1);
  return (rows || []).map(c => ({ ...c, active_token_count: counts.get(c.client_id) || 0 }));
}

export async function revokeOAuthSessions(user_id, client_id = null) {
  const filter = client_id ? `&client_id=eq.${encodeURIComponent(client_id)}` : '';
  const rows = await rest(`oauth_tokens?user_id=eq.${encodeURIComponent(user_id)}&revoked=eq.false${filter}`, { method: 'PATCH', prefer: 'return=representation', body: { revoked: true } });
  return { revoked: Array.isArray(rows) ? rows.length : 0 };
}

export async function purgeOAuthData() {
  const now = encodeURIComponent(nowIso());
  const codes = await rest(`oauth_codes?or=(expires_at.lt.${now},used.eq.true)&select=code_hash`, { method: 'DELETE', prefer: 'return=representation' });
  const tokens = await rest(`oauth_tokens?or=(expires_at.lt.${now},revoked.eq.true)&select=token_hash`, { method: 'DELETE', prefer: 'return=representation' });
  const cutoff = encodeURIComponent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const oldClients = await rest(`oauth_clients?created_at=lt.${cutoff}&select=client_id`);
  let clients = [];
  if (oldClients?.length) {
    // oauth_clients has ON DELETE CASCADE to oauth_codes and oauth_tokens, so deleting a
    // client wipes its sessions too. Dead tokens were just purged above, so anything left
    // in oauth_tokens right now is active — only delete clients with none remaining.
    // Being old is never enough on its own; an actively used client must survive.
    const remaining = await rest('oauth_tokens?select=client_id');
    const liveClientIds = new Set((remaining || []).map(t => t.client_id));
    const toDelete = oldClients.map(c => c.client_id).filter(id => !liveClientIds.has(id));
    if (toDelete.length) {
      const inList = toDelete.map(id => encodeURIComponent(id)).join(',');
      clients = await rest(`oauth_clients?client_id=in.(${inList})&select=client_id`, { method: 'DELETE', prefer: 'return=representation' }) || [];
    }
  }
  return { oauth_codes: codes?.length || 0, oauth_tokens: tokens?.length || 0, oauth_clients: clients?.length || 0 };
}

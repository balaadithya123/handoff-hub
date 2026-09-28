import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ACCESS_TTL_SECONDS = 60 * 60;            // 1 hour
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CODE_TTL_SECONDS = 5 * 60;               // 5 minutes

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const randomToken = (prefix, bytes = 32) => `${prefix}${crypto.randomBytes(bytes).toString('hex')}`;
const inSeconds = s => new Date(Date.now() + s * 1000).toISOString();
const nowIso = () => new Date().toISOString();

// Only hashes of codes and tokens are ever stored; the raw values exist only
// in the response that hands them to the client.
async function rest(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} failed: ${r.status}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

export async function createClient({ client_name, redirect_uris }) {
  const client_id = randomToken('hhc_', 16);
  await rest('oauth_clients', {
    method: 'POST',
    prefer: 'return=minimal',
    body: { client_id, client_name: client_name || null, redirect_uris }
  });
  return { client_id, client_name: client_name || null, redirect_uris };
}

export async function getClient(client_id) {
  if (!client_id || typeof client_id !== 'string') return null;
  const rows = await rest(`oauth_clients?client_id=eq.${encodeURIComponent(client_id)}&select=client_id,client_name,redirect_uris`);
  return rows?.[0] ?? null;
}

export async function createAuthCode({ client_id, user_id, redirect_uri, code_challenge }) {
  const code = randomToken('hhcode_');
  await rest('oauth_codes', {
    method: 'POST',
    prefer: 'return=minimal',
    body: { code_hash: sha256(code), client_id, user_id, redirect_uri, code_challenge, expires_at: inSeconds(CODE_TTL_SECONDS) }
  });
  return code;
}

// Atomic single-use: the PATCH only matches an unused, unexpired row, so two
// concurrent exchanges of the same code cannot both succeed.
export async function consumeAuthCode(code) {
  if (!code || typeof code !== 'string') return null;
  const rows = await rest(
    `oauth_codes?code_hash=eq.${sha256(code)}&used=eq.false&expires_at=gt.${encodeURIComponent(nowIso())}`,
    { method: 'PATCH', prefer: 'return=representation', body: { used: true } }
  );
  return rows?.[0] ?? null;
}

export async function issueTokens({ client_id, user_id }) {
  const access_token = randomToken('hho_');
  const refresh_token = randomToken('hhr_');
  await rest('oauth_tokens', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [
      { token_hash: sha256(access_token), kind: 'access', client_id, user_id, expires_at: inSeconds(ACCESS_TTL_SECONDS) },
      { token_hash: sha256(refresh_token), kind: 'refresh', client_id, user_id, expires_at: inSeconds(REFRESH_TTL_SECONDS) }
    ]
  });
  return { access_token, token_type: 'Bearer', expires_in: ACCESS_TTL_SECONDS, refresh_token, scope: 'hub' };
}

// Refresh tokens rotate: the old one is revoked atomically as it is used.
export async function rotateRefreshToken(refresh_token, client_id) {
  if (!refresh_token || typeof refresh_token !== 'string') return null;
  const rows = await rest(
    `oauth_tokens?token_hash=eq.${sha256(refresh_token)}&kind=eq.refresh&revoked=eq.false&client_id=eq.${encodeURIComponent(client_id)}&expires_at=gt.${encodeURIComponent(nowIso())}`,
    { method: 'PATCH', prefer: 'return=representation', body: { revoked: true } }
  );
  const row = rows?.[0];
  return row ? issueTokens({ client_id, user_id: row.user_id }) : null;
}

export async function userIdFromAccessToken(token) {
  if (!SUPABASE_URL || !SERVICE_KEY || !token) return null;
  try {
    const rows = await rest(
      `oauth_tokens?token_hash=eq.${sha256(token)}&kind=eq.access&revoked=eq.false&expires_at=gt.${encodeURIComponent(nowIso())}&select=user_id`
    );
    return rows?.[0]?.user_id ?? null;
  } catch {
    return null;
  }
}

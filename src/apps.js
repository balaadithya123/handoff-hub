import crypto from 'node:crypto';
import { getToken } from '@vercel/connect';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENC_KEY = process.env.PROVIDER_TOKEN_ENC_KEY;
const VERCEL_CONNECTOR = process.env.VERCEL_CONNECTOR || 'vercel/vercel';
const VERSION = '0.18.0';
const MAX_CHARS = 20000;
const SERVERS = {
  supabase: 'https://mcp.supabase.com/mcp',
  vercel: 'https://mcp.vercel.com',
  canva: 'https://mcp.canva.com/mcp'
};
const LINK_HINT = 'Your Hub account is not linked to a portal account yet. Open the portal dashboard, copy the code in the AI apps section, then call link_portal_account with it.';

function need(v, n) { if (!v) throw new Error(n + ' is not configured on the Handoff Hub server'); return v; }

async function rest(path, { method = 'GET', body, prefer } = {}) {
  need(SUPABASE_URL, 'SUPABASE_URL');
  need(SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const t = await r.text();
  if (!r.ok) throw new Error('Database request failed: ' + r.status);
  return t ? JSON.parse(t) : null;
}

const key32 = () => crypto.createHash('sha256').update(need(ENC_KEY, 'PROVIDER_TOKEN_ENC_KEY')).digest();
function encrypt(v) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key32(), iv);
  const d = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), d].map(x => x.toString('base64url')).join('.');
}
function decrypt(s) {
  const [iv, tag, d] = s.split('.').map(x => Buffer.from(x, 'base64url'));
  const c = crypto.createDecipheriv('aes-256-gcm', key32(), iv);
  c.setAuthTag(tag);
  return Buffer.concat([c.update(d), c.final()]).toString('utf8');
}

async function accountFor(userId) {
  const rows = await rest('portal_hub_links?hub_user_id=eq.' + encodeURIComponent(userId) + '&select=account_id&limit=1');
  return rows?.[0]?.account_id || null;
}

export async function linkPortalAccount(userId, code) {
  const res = await rest('rpc/portal_link_consume', { method: 'POST', body: { p_code: String(code || ''), p_hub_user: userId } });
  if (!res?.ok) throw new Error(res?.error || 'Could not link the account.');
  return { linked: true, next: 'Call connected_apps to see what you have connected.' };
}

export async function connectedApps(userId) {
  const acc = await accountFor(userId);
  if (!acc) return { linked: false, how_to_link: LINK_HINT, supported_apps: Object.keys(SERVERS) };
  const rows = await rest('provider_connections?account_id=eq.' + encodeURIComponent(acc) + '&select=provider,provider_account_name,expires_at,updated_at');
  if (VERCEL_CONNECTOR) { try { await getToken(VERCEL_CONNECTOR, { subject: { type: 'user', id: String(acc) } }); if (!rows.some(r => r.provider === 'vercel')) rows.push({ provider: 'vercel', provider_account_name: null, expires_at: null, updated_at: new Date().toISOString() }); } catch {} }
  return { linked: true, supported_apps: Object.keys(SERVERS), connections: (rows || []).map(r => ({ provider: r.provider, account: r.provider_account_name, connected_at: r.updated_at, expires_at: r.expires_at })) };
}

async function tokenFor(userId, provider) {
  if (provider === 'vercel') { const acc = await accountFor(userId); if (!acc) throw new Error(LINK_HINT); try { return await getToken(VERCEL_CONNECTOR, { subject: { type: 'user', id: String(acc) } }); } catch { throw new Error('Connect Vercel in the portal first.'); } }

  if (!SERVERS[provider]) throw new Error('Unsupported app. Supported: ' + Object.keys(SERVERS).join(', '));
  const acc = await accountFor(userId);
  if (!acc) throw new Error(LINK_HINT);
  const row = (await rest('provider_connections?account_id=eq.' + encodeURIComponent(acc) + '&provider=eq.' + encodeURIComponent(provider) + '&select=access_token,refresh_token,expires_at,client_meta&limit=1'))?.[0];
  if (!row) throw new Error('Connect ' + provider + ' in the portal first.');
  const expiring = row.expires_at && new Date(row.expires_at).getTime() < Date.now() + 60000;
  if (!expiring) return decrypt(row.access_token);
  const m = row.client_meta;
  if (!row.refresh_token || !m?.token_endpoint || !m?.client_id) throw new Error('The ' + provider + ' connection expired. Reconnect it in the portal.');
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: decrypt(row.refresh_token), client_id: m.client_id, resource: m.resource || SERVERS[provider] });
  if (m.client_secret) form.set('client_secret', decrypt(m.client_secret));
  const r = await fetch(m.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form, signal: AbortSignal.timeout(10000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error('The ' + provider + ' connection could not be refreshed. Reconnect it in the portal.');
  await rest('provider_connections?account_id=eq.' + encodeURIComponent(acc) + '&provider=eq.' + encodeURIComponent(provider), { method: 'PATCH', prefer: 'return=minimal', body: {
    access_token: encrypt(d.access_token),
    refresh_token: d.refresh_token ? encrypt(d.refresh_token) : row.refresh_token,
    expires_at: d.expires_in ? new Date(Date.now() + Number(d.expires_in) * 1000).toISOString() : null
  } });
  return d.access_token;
}

function post(server, token, body, sid) {
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' };
  if (sid) headers['Mcp-Session-Id'] = sid;
  return fetch(server, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
}

async function readRpc(r, id, provider) {
  const txt = await r.text();
  if (!r.ok) {
    const hint = r.status === 401 || r.status === 403 ? ' Reconnect ' + provider + ' in the portal.' : '';
    throw new Error(provider + ' returned HTTP ' + r.status + '.' + hint + (txt ? ' ' + txt.slice(0, 160) : ''));
  }
  if ((r.headers.get('content-type') || '').includes('text/event-stream')) {
    for (const block of txt.split(/\n\n/)) {
      const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
      if (!data) continue;
      try { const j = JSON.parse(data); if (j.id === id) return j; } catch { /* skip */ }
    }
    throw new Error('No response from ' + provider);
  }
  return JSON.parse(txt);
}

async function rpcCall(userId, provider, method, params) {
  const token = await tokenFor(userId, provider), server = SERVERS[provider];
  const init = await post(server, token, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'handoff-hub', version: VERSION } } });
  const sid = init.headers.get('mcp-session-id') || undefined;
  const ij = await readRpc(init, 1, provider);
  if (ij.error) throw new Error(provider + ': ' + (ij.error.message || 'initialize failed'));
  await post(server, token, { jsonrpc: '2.0', method: 'notifications/initialized' }, sid).then(r => r.text()).catch(() => {});
  const j = await readRpc(await post(server, token, { jsonrpc: '2.0', id: 2, method, params }, sid), 2, provider);
  if (j.error) throw new Error(provider + ': ' + (j.error.message || 'request failed'));
  return j.result;
}

export async function appListTools(userId, provider, toolName) {
  const res = await rpcCall(userId, provider, 'tools/list', {});
  const tools = res?.tools || [];
  if (toolName) {
    const t = tools.find(x => x.name === toolName);
    if (!t) throw new Error('No tool named ' + toolName + ' on ' + provider);
    return t;
  }
  return { provider, count: tools.length, tools: tools.map(t => ({ name: t.name, description: String(t.description || '').slice(0, 200), arguments: Object.keys(t.inputSchema?.properties || {}) })) };
}

export async function appCallTool(userId, provider, tool, args) {
  const res = await rpcCall(userId, provider, 'tools/call', { name: tool, arguments: args || {} });
  const s = JSON.stringify(res);
  return s.length > MAX_CHARS ? { truncated: true, note: 'Result cut to ' + MAX_CHARS + ' characters; narrow the request.', result: s.slice(0, MAX_CHARS) } : res;
}

import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENC_KEY = process.env.PROVIDER_TOKEN_ENC_KEY;
const base = () => (process.env.PUBLIC_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000')).replace(/\/$/, '');

// Classic OAuth apps: need a client ID/secret registered by the app owner.
const CFG = {
  github: { client: 'GITHUB_CLIENT_ID', secret: 'GITHUB_CLIENT_SECRET', auth: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', scope: 'read:user user:email repo' },
  canva: { client: 'CANVA_CLIENT_ID', secret: 'CANVA_CLIENT_SECRET', auth: 'https://www.canva.com/api/oauth/authorize', token: 'https://api.canva.com/rest/v1/oauth/token', scope: 'design:meta:read design:content:read profile:read' },
  vercel: { client: 'VERCEL_CLIENT_ID', secret: 'VERCEL_CLIENT_SECRET', auth: 'https://vercel.com/oauth/authorize', token: 'https://api.vercel.com/login/oauth/token', scope: 'openid email profile offline_access' }
};

// MCP servers: the app registers itself automatically during sign-in (no client ID/secret to set up).
const MCP = {
  supabase: { name: 'Supabase', server: 'https://mcp.supabase.com/mcp' },
  vercel: { name: 'Vercel', server: 'https://mcp.vercel.com', note: 'Vercel only lets AI apps on its approved list connect, so this may be refused.' },
  canva: { name: 'Canva', server: 'https://mcp.canva.com/mcp' }
};
const PROVIDERS = ['github', 'canva', 'vercel', 'supabase'];

const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const rnd = (n = 32) => crypto.randomBytes(n).toString('base64url');
const pkce = v => crypto.createHash('sha256').update(v).digest('base64url');
const classicReady = p => Boolean(CFG[p] && process.env[CFG[p].client] && process.env[CFG[p].secret]);

function env(v, n) { if (!v) throw new Error(n + ' is not configured on the Handoff Hub server'); return v; }

async function rest(path, o = {}) {
  env(SUPABASE_URL, 'SUPABASE_URL');
  env(SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  const h = { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' };
  if (o.prefer) h.Prefer = o.prefer;
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { method: o.method || 'GET', headers: h, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
  const t = await r.text();
  let d = {};
  try { d = t ? JSON.parse(t) : {}; } catch { /* non-JSON body */ }
  if (!r.ok) throw new Error('Supabase request failed: ' + r.status);
  return d;
}

function key32() { return crypto.createHash('sha256').update(env(ENC_KEY, 'PROVIDER_TOKEN_ENC_KEY')).digest(); }
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

async function account(session) {
  if (!session) return null;
  const rows = await rest('portal_sessions?token_hash=eq.' + encodeURIComponent(hash(session)) + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=account_id&limit=1');
  return rows?.[0]?.account_id || null;
}

function callback(p) { return base() + '/api/provider-oauth?callback=1&provider=' + encodeURIComponent(p); }

async function newFlow(id, p, ver, meta) {
  const state = rnd();
  await rest('provider_oauth_flows', { method: 'POST', prefer: 'return=minimal', body: { state_hash: hash(state), account_id: id, provider: p, code_verifier: ver, client_meta: meta || null, expires_at: new Date(Date.now() + 600000).toISOString() } });
  return state;
}

// ---------- classic OAuth app flow ----------
async function startClassic(p, id) {
  const c = CFG[p], ver = rnd(48), state = await newFlow(id, p, ver, null);
  const u = new URL(c.auth);
  u.searchParams.set('client_id', process.env[c.client]);
  u.searchParams.set('redirect_uri', callback(p));
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', pkce(ver));
  u.searchParams.set('code_challenge_method', 'S256');
  u.searchParams.set('scope', c.scope);
  return u.toString();
}

async function exchange(p, code, row) {
  const c = CFG[p];
  const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: process.env[c.client], client_secret: process.env[c.secret], code, redirect_uri: callback(p), code_verifier: row.code_verifier });
  const h = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  if (p === 'canva') h.Authorization = 'Basic ' + Buffer.from(process.env[c.client] + ':' + process.env[c.secret]).toString('base64');
  const r = await fetch(c.token, { method: 'POST', headers: h, body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(d.error_description || d.message || d.error || 'OAuth token exchange failed');
  return d;
}

async function profile(p, token) {
  const h = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
  if (p === 'github') {
    const r = await fetch('https://api.github.com/user', { headers: { ...h, 'X-GitHub-Api-Version': '2022-11-28' } }), d = await r.json().catch(() => ({}));
    return r.ok ? { id: String(d.id), name: d.login || d.name } : {};
  }
  if (p === 'canva') {
    const r = await fetch('https://api.canva.com/rest/v1/users/me/profile', { headers: h }), d = await r.json().catch(() => ({}));
    return r.ok ? { name: d?.profile?.display_name } : {};
  }
  const r = await fetch('https://api.vercel.com/login/oauth/userinfo', { headers: h }), d = await r.json().catch(() => ({}));
  return r.ok ? { id: d.sub, name: d.preferred_username || d.name || d.email } : {};
}

// ---------- MCP self-registration flow ----------
async function jget(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function firstOk(urls) {
  for (const u of urls) { try { return await jget(u); } catch { /* try next */ } }
  return null;
}

async function discover(server) {
  const s = new URL(server), path = s.pathname === '/' ? '' : s.pathname.replace(/\/$/, '');
  const pr = await firstOk([s.origin + '/.well-known/oauth-protected-resource' + path, s.origin + '/.well-known/oauth-protected-resource']);
  const issuer = pr?.authorization_servers?.[0] || s.origin, i = new URL(issuer), ip = i.pathname === '/' ? '' : i.pathname.replace(/\/$/, '');
  const meta = await firstOk([
    i.origin + '/.well-known/oauth-authorization-server' + ip,
    i.origin + '/.well-known/openid-configuration' + ip,
    issuer.replace(/\/$/, '') + '/.well-known/openid-configuration'
  ]);
  if (!meta?.authorization_endpoint || !meta?.token_endpoint) throw new Error('Could not find the sign-in details for ' + server);
  return { meta, resource: pr?.resource || server, scopes: Array.isArray(pr?.scopes_supported) ? pr.scopes_supported : null };
}

async function register(meta, name, note) {
  if (!meta.registration_endpoint) throw new Error(name + ' does not allow apps to register themselves.' + (note ? ' ' + note : ''));
  const r = await fetch(meta.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ client_name: 'Handoff Hub', redirect_uris: [callback(name.toLowerCase())], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.client_id) throw new Error(name + ' refused the app registration (' + (d.error_description || d.error || r.status) + ').' + (note ? ' ' + note : ''));
  return d;
}

async function startMcp(p, id) {
  const m = MCP[p], d = await discover(m.server), cl = await register(d.meta, m.name, m.note), ver = rnd(48);
  const state = await newFlow(id, p, ver, { client_id: cl.client_id, client_secret: cl.client_secret ? encrypt(cl.client_secret) : null, token_endpoint: d.meta.token_endpoint, resource: d.resource });
  const u = new URL(d.meta.authorization_endpoint);
  u.searchParams.set('client_id', cl.client_id);
  u.searchParams.set('redirect_uri', callback(p));
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', pkce(ver));
  u.searchParams.set('code_challenge_method', 'S256');
  u.searchParams.set('resource', d.resource);
  if (d.scopes?.length) u.searchParams.set('scope', d.scopes.join(' '));
  return u.toString();
}

async function exchangeMcp(p, code, row) {
  const m = row.client_meta;
  const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: m.client_id, code, redirect_uri: callback(p), code_verifier: row.code_verifier, resource: m.resource });
  if (m.client_secret) form.set('client_secret', decrypt(m.client_secret));
  const r = await fetch(m.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form, signal: AbortSignal.timeout(10000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(d.error_description || d.error || 'Token exchange failed');
  return d;
}

// ---------- shared ----------
async function start(p, session) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  if (!PROVIDERS.includes(p)) throw new Error('Unsupported provider');
  env(ENC_KEY, 'PROVIDER_TOKEN_ENC_KEY');
  if (classicReady(p)) return startClassic(p, id);
  if (MCP[p]) return startMcp(p, id);
  throw new Error('GitHub cannot connect without a registered OAuth app. Set ' + CFG[p].client + ' and ' + CFG[p].secret + ' on the Handoff Hub server.');
}

async function complete(p, code, state) {
  const rows = await rest('provider_oauth_flows?state_hash=eq.' + encodeURIComponent(hash(state)) + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=account_id,provider,code_verifier,client_meta&limit=1'), row = rows?.[0];
  if (!row || row.provider !== p) throw new Error('Invalid or expired OAuth state');
  const mcp = Boolean(row.client_meta?.token_endpoint);
  const t = mcp ? await exchangeMcp(p, code, row) : await exchange(p, code, row);
  const pr = mcp ? {} : await profile(p, t.access_token).catch(() => ({}));
  await rest('provider_connections?account_id=eq.' + encodeURIComponent(row.account_id) + '&provider=eq.' + encodeURIComponent(p), { method: 'DELETE', prefer: 'return=minimal' }).catch(() => {});
  await rest('provider_connections', { method: 'POST', prefer: 'return=minimal', body: {
    account_id: row.account_id, provider: p, access_token: encrypt(t.access_token),
    refresh_token: t.refresh_token ? encrypt(t.refresh_token) : null,
    expires_at: t.expires_in ? new Date(Date.now() + Number(t.expires_in) * 1000).toISOString() : null,
    provider_account_id: pr.id || null, provider_account_name: pr.name || null, scope: t.scope || null,
    client_meta: mcp ? row.client_meta : null
  } });
  const ticket = rnd();
  await rest('provider_oauth_flows?state_hash=eq.' + encodeURIComponent(hash(state)), { method: 'PATCH', prefer: 'return=minimal', body: { completed_at: new Date().toISOString(), ticket_hash: hash(ticket), code_verifier: null, client_meta: null } });
  return ticket;
}

async function consume(p, session, ticket) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  const rows = await rest('provider_oauth_flows?ticket_hash=eq.' + encodeURIComponent(hash(ticket)) + '&provider=eq.' + encodeURIComponent(p) + '&account_id=eq.' + encodeURIComponent(id) + '&completed_at=not.is.null&consumed_at=is.null&select=state_hash&limit=1');
  if (!rows?.[0]) throw new Error('Invalid or expired connection ticket');
  await rest('provider_oauth_flows?ticket_hash=eq.' + encodeURIComponent(hash(ticket)), { method: 'PATCH', prefer: 'return=minimal', body: { consumed_at: new Date().toISOString() } });
  return true;
}

async function status(session) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  return await rest('provider_connections?account_id=eq.' + encodeURIComponent(id) + '&select=provider,provider_account_name,scope,updated_at');
}

async function disconnect(p, session) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  if (!PROVIDERS.includes(p)) throw new Error('Unsupported provider');
  await rest('provider_connections?account_id=eq.' + encodeURIComponent(id) + '&provider=eq.' + encodeURIComponent(p), { method: 'DELETE', prefer: 'return=minimal' });
  return { ok: true };
}

export async function providerAction(b) {
  if (b.action === 'start') return { authorization_url: await start(b.provider, b.portal_session) };
  if (b.action === 'consume') return { ok: await consume(b.provider, b.portal_session, b.ticket) };
  if (b.action === 'status') return { connections: await status(b.portal_session), providers: PROVIDERS.map(provider => ({ provider, configured: classicReady(provider) || Boolean(MCP[provider]), method: classicReady(provider) ? 'oauth_app' : MCP[provider] ? 'mcp' : 'none' })) };
  if (b.action === 'disconnect') return disconnect(b.provider, b.portal_session);
  throw new Error('Unknown action');
}

export async function providerCallback(p, code, state) { return complete(p, code, state); }

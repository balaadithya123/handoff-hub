import crypto from 'node:crypto';
import { startAuthorization, getToken, revokeToken } from '@vercel/connect';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENC_KEY = process.env.PROVIDER_TOKEN_ENC_KEY;
const VERCEL_CONNECTOR = process.env.VERCEL_CONNECTOR || 'vercel/vercel';
const base = () => 'https://handoff-mcp.vercel.app';

// Classic OAuth apps: need a client ID/secret registered by the app owner.
const CFG = {
  github: { client: 'GITHUB_CLIENT_ID', secret: 'GITHUB_CLIENT_SECRET', auth: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', scope: 'read:user user:email repo' },
  canva: { client: 'CANVA_CLIENT_ID', secret: 'CANVA_CLIENT_SECRET', auth: 'https://www.canva.com/api/oauth/authorize', token: 'https://api.canva.com/rest/v1/oauth/token', scope: 'design:meta:read design:content:read profile:read' },
  vercel: { client: 'VERCEL_CLIENT_ID', secret: 'VERCEL_CLIENT_SECRET', auth: 'https://vercel.com/oauth/authorize', token: 'https://api.vercel.com/login/oauth/token', scope: 'openid email profile offline_access' }
};

// MCP servers. By default the app registers itself automatically during sign-in (no client ID/secret to set up).
//   server    verified official remote endpoint. Without it the provider is looked up in the MCP registry by name.
//   app       env var names [CLIENT_ID, CLIENT_SECRET] of a pre-registered OAuth app. Used by providers that do NOT allow
//             apps to register themselves; those stay "needs_app" until the owner creates the app and sets both variables.
//   endpoints published sign-in URLs, used only when the server exposes no discovery metadata.
//   params    extra authorization parameters the provider requires.
// Every provider is checked up front (see resolve), so the portal shows what can really connect instead of a Connect
// button that fails after the click.
const GOOGLE_APP = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const GOOGLE_EP = { authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth', token_endpoint: 'https://oauth2.googleapis.com/token' };
const GOOGLE_PARAMS = { access_type: 'offline', prompt: 'consent' };
const MCP = {
  supabase: { name: 'Supabase', server: 'https://mcp.supabase.com/mcp' },
  canva: { name: 'Canva', server: 'https://mcp.canva.com/mcp' },
  notion: { name: 'Notion', server: 'https://mcp.notion.com/mcp' },
  linear: { name: 'Linear', server: 'https://mcp.linear.app/mcp' },
  jira: { name: 'Jira', server: 'https://mcp.atlassian.com/v1/mcp' },
  asana: { name: 'Asana', server: 'https://mcp.asana.com/mcp' },
  sentry: { name: 'Sentry', server: 'https://mcp.sentry.dev/mcp' },
  figma: { name: 'Figma', server: 'https://mcp.figma.com/mcp' },
  gitlab: { name: 'GitLab', server: 'https://gitlab.com/api/v4/mcp' },
  dropbox: { name: 'Dropbox', server: 'https://mcp.dropbox.com/mcp' },
  // Official servers that require a registered OAuth app (no self-registration).
  slack: { name: 'Slack', server: 'https://mcp.slack.com/mcp', app: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'] },
  hubspot: { name: 'HubSpot', server: 'https://mcp.hubspot.com', app: ['HUBSPOT_CLIENT_ID', 'HUBSPOT_CLIENT_SECRET'] },
  box: { name: 'Box', server: 'https://mcp.box.com', app: ['BOX_CLIENT_ID', 'BOX_CLIENT_SECRET'], endpoints: { authorization_endpoint: 'https://account.box.com/api/oauth2/authorize', token_endpoint: 'https://api.box.com/oauth2/token' } },
  // Google's Workspace MCP servers need your own Google Cloud OAuth client ("Use this client for an AI-powered agent").
  // Scopes are the ones Google's setup guide lists for each server; <PROVIDER>_SCOPES (e.g. GOOGLE_DRIVE_SCOPES) overrides them.
  'google-drive': { name: 'Google Drive', server: 'https://drivemcp.googleapis.com/mcp/v1', app: GOOGLE_APP, endpoints: GOOGLE_EP, params: GOOGLE_PARAMS, scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file' },
  gmail: { name: 'Gmail', server: 'https://gmailmcp.googleapis.com/mcp/v1', app: GOOGLE_APP, endpoints: GOOGLE_EP, params: GOOGLE_PARAMS, scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose' },
  'google-calendar': { name: 'Google Calendar', server: 'https://calendarmcp.googleapis.com/mcp/v1', app: GOOGLE_APP, endpoints: GOOGLE_EP, params: GOOGLE_PARAMS, scope: 'https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events.freebusy https://www.googleapis.com/auth/calendar.events.readonly' },
  // Zendesk's /api/mcp answers with RFC 9728 metadata and advertises self-registration, but Zendesk has not documented it.
  // The pre-flight check below confirms registration is really offered before Connect is shown, and a refusal is remembered.
  zendesk: { name: 'Zendesk', server: 'https://mcp.zendesk.com/api/mcp' },
  // Microsoft: its Teams/SharePoint/OneDrive MCP servers are preview-only, need a Microsoft Entra app plus tenant admin
  // approval (Entra has no self-registration), and OneNote has none. No endpoint is guessed; only the MCP registry is checked.
  'microsoft-teams': { name: 'Microsoft Teams', note: 'Microsoft only offers its Teams MCP server in preview, and it needs a Microsoft Entra app with tenant admin approval, which the Hub does not support yet.' },
  sharepoint: { name: 'SharePoint', note: 'Microsoft only offers its SharePoint MCP server in preview, and it needs a Microsoft Entra app with tenant admin approval, which the Hub does not support yet.' },
  onenote: { name: 'OneNote', note: 'Microsoft does not offer a OneNote MCP server yet.' }
};
const PROVIDERS = Object.keys({...CFG,...MCP});

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

function callback(p) { return base() + '/oauth/provider/' + encodeURIComponent(p); }
// MCP servers are stricter about redirect URIs, so they get a clean path with no query string (rewritten in vercel.json).
function callbackMcp(p) { return base() + '/oauth/provider/' + encodeURIComponent(p); }

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

// The redirect URI must use the provider id (e.g. google-drive), the same value the callback route uses.
async function register(meta, name, pid) {
  if (!meta.registration_endpoint) throw new Error(name + ' does not allow apps to register themselves, so it cannot be connected without an approved OAuth app.');
  const r = await fetch(meta.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ client_name: 'Handoff Hub', redirect_uris: [callbackMcp(pid)], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.client_id) throw new Error(name + ' refused the app registration (' + (d.error_description || d.error || r.status) + ').');
  return d;
}

async function registryServer(provider) {
  const aliases = {
    'google-drive':['google drive','googledrive'], 'google-calendar':['google calendar','googlecalendar'],
    'microsoft-teams':['microsoft teams','teams']
  };
  const wanted = (aliases[provider] || [provider]).map(x=>x.toLowerCase());
  // Search by name: the registry has thousands of entries, so an unfiltered first page rarely contains the app.
  const r = await fetch('https://registry.modelcontextprotocol.io/v0.1/servers?limit=100&version=latest&search=' + encodeURIComponent(wanted[0]),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!r.ok) throw new Error('MCP registry unavailable');
  const d=await r.json();
  const entries=Array.isArray(d?.servers)?d.servers.map(x=>x?.server??x).filter(Boolean):[];
  const entry=entries.find(s=>{const n=String(s.title||s.name||'').toLowerCase().replace(/[._/-]+/g,' ').replace(/\s+/g,' ').trim();return wanted.some(a=>n===a||n.endsWith(' '+a)||n.startsWith(a+' '));});
  const remote=entry?.remotes?.find(x=>typeof x?.url==='string'&&/^https?:\/\//i.test(x.url));
  if(!remote?.url) throw new Error(MCP[provider].name+' has no official remote MCP server in the registry yet, so it cannot be connected here.');
  return remote.url;
}
// ---------- availability: can this provider really connect right now? ----------
// Resolved once up front and cached, so the portal never offers a Connect button that is certain to fail.
//   ready        the Hub can start a real sign-in now
//   needs_app    the provider needs an OAuth app the owner must create; `setup` says which variables to set
//   unavailable  cannot be connected (no official remote server, endpoint unreachable, registration refused)
const FOUND_OK_MS = 60 * 60 * 1000, FOUND_BAD_MS = 2 * 60 * 1000, RESOLVE_BUDGET_MS = 6000;
const foundCache = new Map();
const envKey = p => p.toUpperCase().replace(/-/g, '_');
const appCreds = m => (m?.app && process.env[m.app[0]] && process.env[m.app[1]]) ? { id: process.env[m.app[0]], secret: process.env[m.app[1]] } : null;
const remember = (p, v) => foundCache.set(p, { v, until: Date.now() + (v.error ? FOUND_BAD_MS : FOUND_OK_MS) });

// Locates the server and its sign-in details. Never throws: failures come back as { error } so they can be reported and cached.
async function found(p) {
  const hit = foundCache.get(p);
  if (hit && hit.until > Date.now()) return hit.v;
  let v;
  try {
    const m = MCP[p], server = m.server || await registryServer(p);
    const d = await discover(server).catch(e => { if (m.endpoints) return { meta: m.endpoints, resource: server, scopes: null }; throw e; });
    v = { server, d };
  } catch (e) { v = { error: e?.message || String(e) }; }
  remember(p, v);
  return v;
}

async function resolve(p) {
  if (p === 'vercel') return { state: 'ready', method: 'vercel_connect' };
  if (classicReady(p)) return { state: 'ready', method: 'oauth_app' };
  const m = MCP[p];
  if (!m) {
    const c = CFG[p];
    return { state: 'needs_app', method: 'oauth_app', reason: p + ' cannot connect without a registered OAuth app. Set ' + c.client + ' and ' + c.secret + ' on the Handoff Hub server.', setup: { env: [c.client, c.secret], redirect_uri: callback(p) } };
  }
  const creds = appCreds(m);
  const f = await found(p);
  if (!creds && m.app) {
    // Without an OAuth app, still connect if the server really does let apps register themselves (so nothing that worked before is blocked).
    if (!f.error && f.d.meta.registration_endpoint) return { state: 'ready', method: 'mcp', creds, ...f };
    return { state: 'needs_app', method: 'mcp', reason: m.name + ' does not allow apps to register themselves. Create an OAuth app with ' + m.name + ', then set ' + m.app.join(' and ') + ' on the Handoff Hub server.', setup: { env: m.app, redirect_uri: callbackMcp(p) } };
  }
  if (f.error) return { state: 'unavailable', method: 'mcp', reason: !m.server && m.note ? m.note : f.error };
  if (!creds && !f.d.meta.registration_endpoint) return { state: 'unavailable', method: 'mcp', reason: m.name + ' does not allow apps to register themselves, so it cannot be connected without an approved OAuth app.' };
  return { state: 'ready', method: 'mcp', creds, ...f };
}

const withTimeout = (promise, ms, fallback) => new Promise(done => {
  const t = setTimeout(() => done(fallback), ms);
  promise.then(v => { clearTimeout(t); done(v); }, () => { clearTimeout(t); done(fallback); });
});

// What the portal gets: the state only, never credentials or discovery details.
async function providerStates() {
  return Promise.all(PROVIDERS.map(async provider => {
    const r = await withTimeout(resolve(provider), RESOLVE_BUDGET_MS, { state: 'unknown', method: 'mcp' });
    return { provider, configured: r.state === 'ready', state: r.state, method: r.method || 'none', reason: r.reason || null, setup: r.setup || null };
  }));
}

async function startMcp(p, id, r) {
  const m = MCP[p], d = r.d, ver = rnd(48);
  let cl;
  if (r.creds) cl = { client_id: r.creds.id, client_secret: r.creds.secret };
  else {
    // Some providers only let certain clients self-register. If registration is refused, remember it so the portal stops offering Connect.
    try { cl = await register(d.meta, m.name, p); } catch (e) { remember(p, { error: e?.message || String(e) }); throw e; }
  }
  const state = await newFlow(id, p, ver, { client_id: cl.client_id, client_secret: cl.client_secret ? encrypt(cl.client_secret) : null, token_endpoint: d.meta.token_endpoint, resource: d.resource });
  const u = new URL(d.meta.authorization_endpoint);
  u.searchParams.set('client_id', cl.client_id);
  u.searchParams.set('redirect_uri', callbackMcp(p));
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('state', state);
  u.searchParams.set('code_challenge', pkce(ver));
  u.searchParams.set('code_challenge_method', 'S256');
  u.searchParams.set('resource', d.resource);
  // Scopes come from the server's metadata; <PROVIDER>_SCOPES (e.g. GOOGLE_DRIVE_SCOPES) overrides when a provider publishes none.
  const scope = process.env[envKey(p) + '_SCOPES'] || m.scope || (d.scopes?.length ? d.scopes.join(' ') : '');
  if (scope) u.searchParams.set('scope', scope);
  for (const [k, v] of Object.entries(m.params || {})) u.searchParams.set(k, v);
  return u.toString();
}

async function exchangeMcp(p, code, row) {
  const m = row.client_meta;
  const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: m.client_id, code, redirect_uri: callbackMcp(p), code_verifier: row.code_verifier, resource: m.resource });
  if (m.client_secret) form.set('client_secret', decrypt(m.client_secret));
  const r = await fetch(m.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form, signal: AbortSignal.timeout(10000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(d.error_description || d.error || 'Token exchange failed');
  return d;
}

// ---------- shared ----------
async function startVercelConnect(id) {
  const { url } = await startAuthorization(VERCEL_CONNECTOR, { subject: { type: 'user', id: String(id) } }, { callbackUrl: 'https://handoff-portal.vercel.app/api/connect/vercel/callback' });
  return url;
}
async function vercelConnectAuthorized(id) { try { await getToken(VERCEL_CONNECTOR, { subject: { type: 'user', id: String(id) } }); return true; } catch { return false; } }
async function disconnectVercelConnect(id) { try { await revokeToken(VERCEL_CONNECTOR, { subject: { type: 'user', id: String(id) } }); } catch {} return { ok: true }; }

async function start(p, session) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  if (!PROVIDERS.includes(p)) throw new Error('Unsupported provider');
  env(ENC_KEY, 'PROVIDER_TOKEN_ENC_KEY');
  if (p === 'vercel') return startVercelConnect(id);
  const r = await resolve(p);
  if (r.state !== 'ready') throw new Error(r.reason || 'Could not check whether ' + p + ' can connect. Try again in a moment.');
  return r.method === 'oauth_app' ? startClassic(p, id) : startMcp(p, id, r);
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
  const rows = await rest('provider_connections?account_id=eq.' + encodeURIComponent(id) + '&select=provider,provider_account_name,scope,updated_at');
  if (await vercelConnectAuthorized(id)) { if (!rows.some(r => r.provider === 'vercel')) rows.push({ provider: 'vercel', provider_account_name: null, scope: null, updated_at: new Date().toISOString() }); } else return rows.filter(r => r.provider !== 'vercel');
  return rows;
}

async function disconnect(p, session) {
  const id = await account(session);
  if (!id) throw new Error('Not signed in.');
  if (!PROVIDERS.includes(p)) throw new Error('Unsupported provider');
  if (p === 'vercel') return disconnectVercelConnect(id);
  await rest('provider_connections?account_id=eq.' + encodeURIComponent(id) + '&provider=eq.' + encodeURIComponent(p), { method: 'DELETE', prefer: 'return=minimal' });
  return { ok: true };
}

export async function providerAction(b) {
  if (b.action === 'start') return { authorization_url: await start(b.provider, b.portal_session) };
  if (b.action === 'consume') return { ok: await consume(b.provider, b.portal_session, b.ticket) };
  if (b.action === 'status') {
    const connections = await status(b.portal_session);
    // Availability needs network checks, so it is only computed for callers that show the directory.
    return b.include_providers ? { connections, providers: await providerStates() } : { connections };
  }
  if (b.action === 'disconnect') return disconnect(b.provider, b.portal_session);
  throw new Error('Unknown action');
}

export async function providerCallback(p, code, state) { return complete(p, code, state); }

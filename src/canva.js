import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const SCOPES = process.env.CANVA_SCOPES || 'design:content:write design:meta:read';

function requireEnv(value, name) { if (!value) throw new Error(`${name} is not configured on the Handoff Hub server`); return value; }
function baseUrl() { const b = process.env.PUBLIC_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''); return b.replace(/\/$/, ''); }
function redirectUri() { return `${baseUrl()}/api/canva/oauth/callback`; }
function hash(v) { return crypto.createHash('sha256').update(v).digest('hex'); }
function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function verifier() { return b64url(crypto.randomBytes(32)); }
async function rest(path, {method='GET', body, prefer}={}) {
  requireEnv(SUPABASE_URL, 'SUPABASE_URL'); requireEnv(SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {method, headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})}, body:body===undefined?undefined:JSON.stringify(body)});
  if (!r.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} failed: ${r.status}`);
  const t=await r.text(); return t?JSON.parse(t):null;
}

export async function startCanvaOAuth(userId) {
  requireEnv(CLIENT_ID, 'CANVA_CLIENT_ID');
  const state = b64url(crypto.randomBytes(32));
  const codeVerifier = verifier();
  const challenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest());
  await rest(`canva_connections?user_id=eq.${encodeURIComponent(userId)}`, {method:'DELETE'});
  await rest('canva_connections', {method:'POST',prefer:'return=minimal',body:{user_id:userId,access_token:'pending',oauth_state_hash:hash(state),code_verifier:codeVerifier,state_expires_at:new Date(Date.now()+10*60*1000).toISOString()}});
  const u = new URL('https://www.canva.com/api/oauth/authorize');
  u.searchParams.set('code_challenge',challenge); u.searchParams.set('code_challenge_method','S256'); u.searchParams.set('scope',SCOPES); u.searchParams.set('response_type','code'); u.searchParams.set('client_id',CLIENT_ID); u.searchParams.set('state',state); u.searchParams.set('redirect_uri',redirectUri());
  return {authorization_url:u.toString(),redirect_uri:redirectUri(),scopes:SCOPES};
}

export async function completeCanvaOAuth(code,state) {
  requireEnv(CLIENT_ID,'CANVA_CLIENT_ID'); requireEnv(CLIENT_SECRET,'CANVA_CLIENT_SECRET');
  const rows=await rest(`canva_connections?oauth_state_hash=eq.${encodeURIComponent(hash(state))}&state_expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=user_id,code_verifier`);
  const row=rows?.[0]; if(!row) throw new Error('Invalid or expired Canva OAuth state');
  const form=new URLSearchParams({grant_type:'authorization_code',code,code_verifier:row.code_verifier,redirect_uri:redirectUri()});
  const basic=Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const r=await fetch('https://api.canva.com/rest/v1/oauth/token',{method:'POST',headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(`Canva token exchange failed: ${r.status} ${data?.error || data?.message || ''}`.trim());
  await rest(`canva_connections?user_id=eq.${encodeURIComponent(row.user_id)}`,{method:'PATCH',prefer:'return=minimal',body:{access_token:data.access_token,refresh_token:data.refresh_token||null,expires_at:data.expires_in?new Date(Date.now()+Number(data.expires_in)*1000).toISOString():null,scope:data.scope||SCOPES,oauth_state_hash:null,code_verifier:null,state_expires_at:null,updated_at:new Date().toISOString()}});
  return row.user_id;
}

async function connection(userId) {
  const rows=await rest(`canva_connections?user_id=eq.${encodeURIComponent(userId)}&select=access_token,refresh_token,expires_at,scope`);
  const c=rows?.[0]; if(!c || c.access_token==='pending') throw new Error('Canva is not connected to Handoff Hub. Start Canva OAuth authorization first.');
  return c;
}
async function api(userId,path,options={}) {
  const c=await connection(userId); let token=c.access_token;
  if(c.expires_at && new Date(c.expires_at).getTime() < Date.now()+60000 && c.refresh_token) {
    requireEnv(CLIENT_ID,'CANVA_CLIENT_ID'); requireEnv(CLIENT_SECRET,'CANVA_CLIENT_SECRET');
    const basic=Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const form=new URLSearchParams({grant_type:'refresh_token',refresh_token:c.refresh_token});
    const rr=await fetch('https://api.canva.com/rest/v1/oauth/token',{method:'POST',headers:{Authorization:`Basic ${basic}`,'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const d=await rr.json().catch(()=>({})); if(!rr.ok) throw new Error(`Canva token refresh failed: ${rr.status}`);
    token=d.access_token; await rest(`canva_connections?user_id=eq.${encodeURIComponent(userId)}`,{method:'PATCH',prefer:'return=minimal',body:{access_token:d.access_token,refresh_token:d.refresh_token||c.refresh_token,expires_at:d.expires_in?new Date(Date.now()+Number(d.expires_in)*1000).toISOString():c.expires_at,updated_at:new Date().toISOString()}});
  }
  const r=await fetch(`https://api.canva.com/rest/v1${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(options.headers||{})}});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(`Canva API failed: ${r.status} ${d?.message||d?.error||''}`.trim()); return d;
}
export async function canvaListDesigns(userId,query='') { const q=query?`?query=${encodeURIComponent(query)}`:''; return api(userId,`/designs${q}`); }
export async function canvaGetDesign(userId,designId) { return api(userId,`/designs/${encodeURIComponent(designId)}`); }
export async function canvaCreateDesign(userId,input) { return api(userId,'/designs',{method:'POST',body:JSON.stringify(input)}); }

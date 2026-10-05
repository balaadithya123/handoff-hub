import crypto from 'node:crypto';
import { createClient, getClient, createAuthCode, consumeAuthCode, issueTokens, rotateRefreshToken, countClients } from '../src/oauth-store.js';

const DEFAULT_REDIRECT_HOSTS = ['chatgpt.com', 'openai.com', 'claude.ai', 'claude.com'];

function baseUrl(){if(process.env.PUBLIC_BASE_URL)return process.env.PUBLIC_BASE_URL.replace(/\/$/,'');if(process.env.VERCEL_PROJECT_PRODUCTION_URL)return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;return 'http://localhost:3000';}
function protectedResource(base,req){const path=req.query?.resource_path;return path==='api/mcp'?\`${base}/api/mcp\`:\`${base}/mcp\`;}
function allowedRedirectHosts(){const extra=(process.env.OAUTH_ALLOWED_REDIRECT_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return [...DEFAULT_REDIRECT_HOSTS,...extra];}
function redirectUriAllowed(uri){try{const u=new URL(uri);if(u.protocol!=='https:'||u.username||u.password||u.hash)return false;const host=u.hostname.toLowerCase();return allowedRedirectHosts().some(h=>host===h||host.endsWith(\`.${h}\`));}catch{return false;}}
function routeOf(req){const q=req.query?.route;if(typeof q==='string')return q;const p=new URL(req.url||'/','http://x').pathname;if(p.includes('oauth-protected-resource'))return'resource';if(p.includes('oauth-authorization-server')||p.includes('openid-configuration'))return'metadata';if(p.endsWith('/register'))return'register';if(p.endsWith('/authorize'))return'authorize';if(p.endsWith('/token'))return'token';return null;}
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, MCP-Protocol-Version');}
function bodyOf(req){const b=req.body;if(!b)return{};if(typeof b==='string'){try{return JSON.parse(b);}catch{return Object.fromEntries(new URLSearchParams(b));}}if(Buffer.isBuffer(b))return Object.fromEntries(new URLSearchParams(b.toString('utf8')));return b;}
const str=v=>typeof v==='string'?v:'';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function oauthError(res,status,error,error_description){res.setHeader('Cache-Control','no-store');return res.status(status).json({error,error_description});}
function page(res,status,title,inner){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head><body><main>${inner}</main></body></html>`);}
async function validateAuthRequest(p){if(p.response_type!=='code')return{error:'Only response_type=code is supported.'};const client=await getClient(p.client_id);if(!client)return{error:'Unknown client. Remove and re-add the connector so it registers again.'};if(!client.redirect_uris.includes(p.redirect_uri)||!redirectUriAllowed(p.redirect_uri))return{error:'Redirect address is not registered for this client.'};if(p.code_challenge_method!=='S256'||!/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge))return{error:'PKCE (S256) is required.'};return{client};}

const oauthFields=['response_type','client_id','redirect_uri','state','code_challenge','code_challenge_method','scope','resource'];
function hiddenFields(p){return oauthFields.map(k=>`<input type="hidden" name="${k}" value="${esc(p[k]||'')}">`).join('');}
function emailForm(p,client,error,step='email',email=''){
  const host=new URL(p.redirect_uri).hostname;
  const common=`<h1>Connect to Handoff Hub</h1><p><strong>${esc(client.client_name||'An app')}</strong> wants access to your Handoff Hub.</p>${error?`<p>${esc(error)}</p>`:''}`;
  if(step==='otp') return common+`<form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="verify_email"><input type="hidden" name="email" value="${esc(email)}"><label for="otp">Verification code</label><input id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" required><button name="decision" value="deny" type="submit" formnovalidate>Deny</button><button name="decision" value="approve" type="submit">Verify & approve</button></form>`;
  return common+`<form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="send_email"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" required><button name="decision" value="deny" type="submit" formnovalidate>Deny</button><button name="decision" value="approve" type="submit">Send verification code</button></form>`;
}
async function supabaseAuth(path,body){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return {ok:false,status:500,error:'Supabase authentication is not configured on the server.'};
  const r=await fetch(`${url}/auth/v1/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{}
  return {ok:r.ok,status:r.status,data,error:data?.msg||data?.message||data?.error_description||data?.error||null};
}
async function allowedLoginEmail(){return str(process.env.OAUTH_LOGIN_EMAIL).trim().toLowerCase();}
async function hubOwnerId(){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return null;
  const r=await fetch(`${url}/rest/v1/handoff_state?select=user_id&limit=2`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!r.ok)return null;
  const rows=await r.json();
  return rows?.length===1?rows[0]?.user_id:null;
}
function redirectWith(res,redirect_uri,params){const u=new URL(redirect_uri);for(const[k,v]of Object.entries(params))if(v)u.searchParams.set(k,v);res.setHeader('Cache-Control','no-store');return res.redirect(302,u.toString());}

export default async function handler(req,res){
  cors(res);if(req.method==='OPTIONS')return res.status(204).end();
  const route=routeOf(req),base=baseUrl();
  try{
    if(route==='resource')return res.status(200).json({resource:protectedResource(base,req),authorization_servers:[base],bearer_methods_supported:['header'],scopes_supported:['hub']});
    if(route==='metadata')return res.status(200).json({issuer:base,authorization_endpoint:`${base}/oauth/authorize`,token_endpoint:`${base}/oauth/token`,registration_endpoint:`${base}/oauth/register`,response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none'],scopes_supported:['hub']});
    if(route==='register'){
      if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
      if((await countClients())>=20)return oauthError(res,429,'registration_limit_reached','Too many registered OAuth clients.');
      const b=bodyOf(req),uris=Array.isArray(b.redirect_uris)?b.redirect_uris.filter(u=>typeof u==='string'):[];
      if(!uris.length||uris.length>5)return oauthError(res,400,'invalid_redirect_uri','Provide 1-5 redirect_uris.');
      if(!uris.every(redirectUriAllowed))return oauthError(res,400,'invalid_redirect_uri','Redirect URI host is not allowed for this server.');
      const client=await createClient({client_name:str(b.client_name).slice(0,100),redirect_uris:uris});
      return res.status(201).json({client_id:client.client_id,client_name:client.client_name,redirect_uris:client.redirect_uris,grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none'});
    }
    if(route==='authorize'){
      const source=req.method==='POST'?bodyOf(req):req.query||Object.fromEntries(new URL(req.url,'http://x').searchParams);
      const p=Object.fromEntries(oauthFields.map(k=>[k,str(source[k])]));
      const v=await validateAuthRequest(p);if(v.error)return page(res,400,'Cannot connect',`<h1>Cannot connect</h1><p>${esc(v.error)}</p>`);
      if(req.method==='GET')return page(res,200,'Connect to Handoff Hub',emailForm(p,v.client));
      if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
      const form=bodyOf(req);
      if(form.decision==='deny')return redirectWith(res,p.redirect_uri,{error:'access_denied',state:p.state});
      const allowed=await allowedLoginEmail();
      if(!allowed)return page(res,503,'Connect to Handoff Hub',emailForm(p,v.client,'Email login is not configured yet on this Handoff Hub server.'));
      const email=str(form.email).trim().toLowerCase();
      if(form.action==='send_email'){
        if(email!==allowed)return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,'That email is not authorised for this Handoff Hub.', 'email'));
        const sent=await supabaseAuth('otp',{email,create_user:true});
        if(!sent.ok)return page(res,502,'Connect to Handoff Hub',emailForm(p,v.client,'Could not send the verification email. Please try again later.'));
        return page(res,200,'Check your email',emailForm(p,v.client,'A verification code was sent. Enter it below.','otp',email));
      }
      if(form.action==='verify_email'){
        if(email!==allowed)return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,'That email is not authorised for this Handoff Hub.','otp',email));
        const verified=await supabaseAuth('verify',{email,token:str(form.otp).trim(),type:'email'});
        if(!verified.ok)return page(res,401,'Connect to Handoff Hub',emailForm(p,v.client,'That verification code is invalid or expired.','otp',email));
        const userId=await hubOwnerId();
        if(!userId)return page(res,500,'Connect to Handoff Hub',emailForm(p,v.client,'Handoff Hub could not identify its single active owner.','otp',email));
        const code=await createAuthCode({client_id:p.client_id,user_id:userId,redirect_uri:p.redirect_uri,code_challenge:p.code_challenge});
        return redirectWith(res,p.redirect_uri,{code,state:p.state});
      }
      return page(res,400,'Connect to Handoff Hub',emailForm(p,v.client,'Start by requesting an email verification code.'));
    }
    if(route==='token'){
      if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
      const b=bodyOf(req),client_id=str(b.client_id),client=await getClient(client_id);if(!client)return oauthError(res,401,'invalid_client','Unknown client_id.');
      res.setHeader('Cache-Control','no-store');
      if(b.grant_type==='authorization_code'){
        const row=await consumeAuthCode(str(b.code));if(!row||row.client_id!==client_id||row.redirect_uri!==str(b.redirect_uri))return oauthError(res,400,'invalid_grant','Authorization code is invalid, expired or already used.');
        const challenge=crypto.createHash('sha256').update(str(b.code_verifier)).digest('base64url'),a=Buffer.from(challenge),c=Buffer.from(row.code_challenge);
        if(a.length!==c.length||!crypto.timingSafeEqual(a,c))return oauthError(res,400,'invalid_grant','PKCE verification failed.');
        return res.status(200).json(await issueTokens({client_id,user_id:row.user_id}));
      }
      if(b.grant_type==='refresh_token'){const tokens=await rotateRefreshToken(str(b.refresh_token),client_id);if(!tokens)return oauthError(res,400,'invalid_grant','Refresh token is invalid, expired or already used.');return res.status(200).json(tokens);}
      return oauthError(res,400,'unsupported_grant_type','Use authorization_code or refresh_token.');
    }
    return res.status(404).json({error:'Not found'});
  }catch(error){console.error('OAuth request failed:',error);if(!res.headersSent)return res.status(500).json({error:'server_error'});}
}

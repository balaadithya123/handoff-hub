import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient, getClient, createAuthCode, consumeAuthCode, issueTokens, rotateRefreshToken, countClients } from '../src/oauth-store.js';

const DEFAULT_REDIRECT_HOSTS = ['chatgpt.com', 'openai.com', 'claude.ai', 'claude.com', 'oauth-redirect.googleusercontent.com', 'vertexaisearch.cloud.google.com'];

function baseUrl(){if(process.env.PUBLIC_BASE_URL)return process.env.PUBLIC_BASE_URL.replace(/\/$/,'');if(process.env.VERCEL_PROJECT_PRODUCTION_URL)return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;return 'http://localhost:3000';}
function protectedResource(base,req){const path=req.query?.resource_path;return path==='api/mcp'?`${base}/api/mcp`:`${base}/mcp`;}
function allowedRedirectHosts(){const extra=(process.env.OAUTH_ALLOWED_REDIRECT_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return [...DEFAULT_REDIRECT_HOSTS,...extra];}
function redirectUriAllowed(uri){try{const u=new URL(uri);if(u.protocol!=='https:'||u.username||u.password||u.hash)return false;const host=u.hostname.toLowerCase();return allowedRedirectHosts().some(h=>host===h||host.endsWith(`.${h}`));}catch{return false;}}
function routeOf(req){const q=req.query?.route;if(typeof q==='string')return q;const raw=String(req.url||'').split('?')[0];if(raw.includes('oauth-protected-resource'))return'resource';if(raw.includes('oauth-authorization-server')||raw.includes('openid-configuration'))return'metadata';if(raw.endsWith('/register'))return'register';if(raw.endsWith('/authorize'))return'authorize';if(raw.endsWith('/token'))return'token';return null;}
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, MCP-Protocol-Version');}
function bodyOf(req){const b=req.body;if(!b)return{};if(typeof b==='string'){try{return JSON.parse(b);}catch{return Object.fromEntries(new URLSearchParams(b));}}if(Buffer.isBuffer(b))return Object.fromEntries(new URLSearchParams(b.toString('utf8')));return b;}
const str=v=>typeof v==='string'?v:'';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail=email=>typeof email==='string'&&email.length<=254&&EMAIL_RE.test(email);
function oauthError(res,status,error,error_description){res.setHeader('Cache-Control','no-store');return res.status(status).json({error,error_description});}

// Best-effort brute-force guard for portal codes (per server instance): at most 10 attempts per IP per 10 minutes.
const portalTries=new Map();
function portalAttemptAllowed(req){
  const ip=String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim()||'?';
  const now=Date.now(),win=10*60*1000;
  const arr=(portalTries.get(ip)||[]).filter(t=>now-t<win);arr.push(now);portalTries.set(ip,arr);
  if(portalTries.size>500){for(const[k,v]of portalTries)if(!v.some(t=>now-t<win))portalTries.delete(k);}
  return arr.length<=10;
}

// Consent / sign-in page styling (Obsidian Signal: black canvas, hairline borders, green accent, white primary button).
const PAGE_CSS=`:root{color-scheme:dark}*{box-sizing:border-box}html,body{margin:0}body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#000;color:#ededed;font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}main{width:100%;max-width:420px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:28px}.brand{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.02em;color:#a1a1a1;margin-bottom:22px}.dot{width:8px;height:8px;border-radius:50%;background:#3ecf8e;box-shadow:0 0 0 3px rgba(62,207,142,.15)}h1{margin:0 0 6px;font-size:22px;line-height:1.25;font-weight:600;letter-spacing:-.01em;color:#fff}.sub{margin:0 0 18px;color:#a1a1a1}.sub strong{color:#fff;font-weight:600}.note{margin:0 0 16px;padding:10px 12px;border-radius:8px;font-size:14px;border:1px solid}.note.err{background:rgba(255,92,92,.08);border-color:rgba(255,92,92,.35);color:#ffb4b4}.note.info{background:rgba(62,207,142,.08);border-color:rgba(62,207,142,.3);color:#9be7c4}label{display:block;margin:14px 0 6px;font-size:13px;font-weight:500;color:#d4d4d4}label em{font-style:normal;color:#8a8a8a;font-weight:400}input[type=email],input[type=password],input[type=text]{width:100%;height:40px;padding:0 12px;background:#000;color:#fff;border:1px solid #2a2a2a;border-radius:8px;font:inherit;outline:none}input:focus-visible{border-color:#3ecf8e;box-shadow:0 0 0 1px #3ecf8e}input#otp,input#pcode{letter-spacing:.35em;font-variant-numeric:tabular-nums;font-size:18px;text-align:center}input#pcode{text-transform:uppercase}fieldset{margin:18px 0 0;padding:14px;border:1px solid #1f1f1f;border-radius:10px;background:#050505}legend{padding:0 6px;font-size:13px;font-weight:600;color:#fff}.opt{display:flex;gap:10px;align-items:flex-start;margin:6px 0;padding:10px 12px;border:1px solid #1f1f1f;border-radius:8px;cursor:pointer;background:#0a0a0a}.opt:has(input:checked){border-color:#3ecf8e;background:rgba(62,207,142,.06)}.opt input{margin:4px 0 0;accent-color:#3ecf8e}.opt span{display:flex;flex-direction:column}.opt b{font-weight:600;color:#fff;font-size:14px}.opt small{color:#8a8a8a;font-size:12.5px;line-height:1.4}.actions{display:flex;flex-direction:row-reverse;gap:10px;margin-top:22px}button{flex:1;height:40px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;border:1px solid transparent}button.primary{flex:2;background:#fff;color:#000}button.primary:hover{background:#e6e6e6}button.ghost{background:transparent;color:#d4d4d4;border-color:#2a2a2a}button.ghost:hover{background:#111}button:focus-visible{outline:2px solid #3ecf8e;outline-offset:2px}.foot{margin:18px 0 0;font-size:12.5px;color:#7a7a7a}.or{display:flex;align-items:center;gap:10px;margin:24px 0 2px;color:#7a7a7a;font-size:12.5px}.or::before,.or::after{content:"";flex:1;height:1px;background:#1f1f1f}.hint{margin:0 0 8px;color:#8a8a8a;font-size:12.5px;line-height:1.45}`;
function page(res,status,title,inner){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>${esc(title)}</title><style>${PAGE_CSS}</style></head><body><main><div class="brand"><span class="dot"></span>Handoff Hub</div>${inner}</main></body></html>`);}
const failPage=(res,status,message)=>page(res,status,'Cannot connect',`<h1>Cannot connect</h1><div class="note err" role="alert">${esc(message)}</div><p class="foot">Go back to the app you were connecting and start the connection again.</p>`);
async function validateAuthRequest(p){if(p.response_type!=='code')return{error:'Only response_type=code is supported.'};const client=await getClient(p.client_id);if(!client)return{error:'Unknown client. Remove and re-add the connector so it registers again.'};if(!client.redirect_uris.includes(p.redirect_uri)||!redirectUriAllowed(p.redirect_uri))return{error:'Redirect address is not registered for this client.'};if(p.code_challenge_method!=='S256'||!/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge))return{error:'PKCE (S256) is required.'};return{client};}

const oauthFields=['response_type','client_id','redirect_uri','state','code_challenge','code_challenge_method','scope','resource'];
function hiddenFields(p){return oauthFields.map(k=>`<input type="hidden" name="${k}" value="${esc(p[k]||'')}">`).join('');}
// NOTE: the primary (approve) button is first in the DOM so pressing Enter approves instead of denying; CSS (row-reverse) shows Deny on the left.
function emailForm(p,client,error,step='email',email='',extra={}){
  const name=esc(client.client_name||'An app');
  const head=`<h1>Connect to Handoff Hub</h1><p class="sub"><strong>${name}</strong> wants access to your Handoff Hub.</p>${error?`<div class="note ${extra.info?'info':'err'}" role="alert">${esc(error)}</div>`:''}`;
  const gate=extra.gate?`<fieldset><legend>${name} is already connected to your Hub</legend><label class="opt"><input type="radio" name="mode" value="replace" required${extra.mode==='replace'?' checked':''}><span><b>Replace the old connection</b><small>Same account reconnecting. The old connection is signed out.</small></span></label><label class="opt"><input type="radio" name="mode" value="add" required${extra.mode==='add'?' checked':''}><span><b>Add as another account</b><small>Keeps both connected. Needs your unlock code.</small></span></label><label for="unlock">Unlock code <em>(only for adding another account)</em></label><input id="unlock" name="unlock" type="password" autocomplete="off"></fieldset>`:'';
  if(step==='otp'){
    return head+`<form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="verify_email"><input type="hidden" name="email" value="${esc(email)}"><label for="otp">Verification code sent to ${esc(email)}</label><input id="otp" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" value="${esc(extra.otp||'')}" required>${gate}<div class="actions"><button class="primary" name="decision" value="approve" type="submit">Verify &amp; approve</button><button class="ghost" name="decision" value="deny" type="submit" formnovalidate>Deny</button></div></form>`;
  }
  if(step==='portal'){
    return head+`<form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="verify_portal"><input type="hidden" name="pcode" value="${esc(extra.pcode||'')}"><p class="hint">Portal code accepted. Choose how to connect.</p>${gate}<div class="actions"><button class="primary" name="decision" value="approve" type="submit">Connect</button><button class="ghost" name="decision" value="deny" type="submit" formnovalidate>Deny</button></div></form>`;
  }
  const portalForm=`<div class="or">or</div><form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="verify_portal"><label for="pcode">Portal code</label><p class="hint">Signed in to the portal? Open AI apps there, generate a code and enter it here. No email needed.</p><input id="pcode" name="pcode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="16" required><div class="actions"><button class="primary" type="submit">Connect with portal code</button></div></form>`;
  return head+`<form method="post" action="/oauth/authorize" autocomplete="off">${hiddenFields(p)}<input type="hidden" name="action" value="send_email"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" required><div class="actions"><button class="primary" name="decision" value="approve" type="submit">Send verification code</button><button class="ghost" name="decision" value="deny" type="submit" formnovalidate>Deny</button></div></form>`+portalForm;
}
async function supabaseAuth(path,body){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return {ok:false,status:500,error:'Supabase authentication is not configured on the server.'};
  const r=await fetch(`${url}/auth/v1/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{}
  return {ok:r.ok,status:r.status,data,error:data?.msg||data?.message||data?.error_description||data?.error||null};
}
const OTP_SUBJECT='Your Handoff Hub verification code';
const otpHtml=code=>`<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Handoff Hub</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p></div>`;
// Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD, a Google app password) can email any address and needs no domain.
// Returns null when Gmail is not configured so the caller can fall back to Resend.
async function sendViaGmail(email,code){
  const user=(process.env.GMAIL_USER||'').trim(),pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s+/g,'');
  if(!user||!pass)return null;
  try{
    const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user,pass},connectionTimeout:10000,socketTimeout:15000});
    await transport.sendMail({from:`Handoff Hub <${user}>`,to:email,subject:OTP_SUBJECT,html:otpHtml(code),text:`Your Handoff Hub verification code is ${code}. It expires in 10 minutes.`});
    return{ok:true,provider:'gmail'};
  }catch(e){
    console.error('Gmail OTP send failed',{code:e?.code,responseCode:e?.responseCode,message:e?.message});
    return{ok:false,provider:'gmail',error:e?.message||'Gmail send failed'};
  }
}
// Resend fallback. Its shared test sender (onboarding@resend.dev) only delivers to the Resend account owner's own address,
// so any other recipient gets 403 until a domain is verified at resend.com/domains and RESEND_FROM is set to an address on it.
async function sendViaResend(email,code){
  const key=process.env.RESEND_API_KEY;
  if(!key)return{ok:false,error:'Email delivery is not configured on the server.'};
  const from=(process.env.RESEND_FROM||'').trim()||'Handoff Hub <onboarding@resend.dev>';
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:OTP_SUBJECT,html:otpHtml(code)})});
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{}
  const error=data?.message||data?.error||null;
  const sandbox=!r.ok&&r.status===403&&/testing emails|verify a domain/i.test(String(error||''));
  if(!r.ok)console.error('Resend OTP send failed',{status:r.status,name:data?.name,message:error,from,sandbox});
  return{ok:r.ok,status:r.status,data,error,sandbox,provider:'resend'};
}
async function sendOtpEmail(email,code){
  const gmail=await sendViaGmail(email,code);
  if(gmail?.ok)return gmail;
  return await sendViaResend(email,code);
}
async function otpDb(path,method='GET',body){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return{ok:false,status:500};
  const r=await fetch(`${url}/rest/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(method==='POST'?{Prefer:'return=representation'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const text=await r.text();let data=[];try{data=text?JSON.parse(text):[];}catch{}
  return{ok:r.ok,status:r.status,data};
}
async function lookupUser(email){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return null;
  const r=await fetch(`${url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!r.ok)return null;
  const rows=await r.json();
  return rows?.[0]?.id||null;
}
// Limits how many accounts of the same AI app (for example two Claude accounts) can use one Hub account. Fails closed.
async function gateClient(userId,clientId,unlock,replace,apply){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return{ok:false,error:'Could not check your account limit. Try again.'};
  try{
    const r=await fetch(`${url}/rest/v1/rpc/hub_client_gate`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_user:userId,p_client:clientId,p_unlock:unlock||null,p_replace:Boolean(replace),p_apply:Boolean(apply)})});
    const d=await r.json().catch(()=>null);
    if(!r.ok||!d)return{ok:false,error:'Could not check your account limit. Try again.'};
    return d;
  }catch{return{ok:false,error:'Could not check your account limit. Try again.'};}
}
async function findOrCreateUser(email){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return null;
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  const q=`${url}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`;
  const existing=await fetch(q,{headers});
  if(existing.ok){const rows=await existing.json();if(rows?.[0]?.id)return rows[0].id;}
  const keyHash=crypto.createHash('sha256').update(`email:${email}:${crypto.randomUUID()}`).digest('hex');
  const created=await fetch(`${url}/rest/v1/users`,{method:'POST',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({email,key_hash:keyHash})});
  if(created.ok){const rows=await created.json();return rows?.[0]?.id||null;}
  if(created.status===409){const retry=await fetch(q,{headers});if(retry.ok){const rows=await retry.json();return rows?.[0]?.id||null;}}
  return null;
}
async function ensureHubOwner(verifiedUserId){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!verifiedUserId)return false;
  const existing=await fetch(`${url}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(verifiedUserId)}&select=user_id&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!existing.ok)return false;
  const rows=await existing.json();
  if(rows?.[0]?.user_id)return true;
  const r=await fetch(`${url}/rest/v1/handoff_state`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:verifiedUserId,user_id:verifiedUserId,state:{projects:{},memories:[],events:[]},version:0,updated_at:new Date().toISOString()})});
  return r.ok||r.status===409;
}
async function hubOwnerId(verifiedUserId){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!verifiedUserId)return null;
  const r=await fetch(`${url}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(verifiedUserId)}&select=user_id&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
  if(!r.ok)return null;
  const rows=await r.json();
  return rows?.[0]?.user_id||null;
}
function redirectWith(res,redirect_uri,params){const u=new URL(redirect_uri);for(const[k,v]of Object.entries(params))if(v)u.searchParams.set(k,v);res.setHeader('Cache-Control','no-store');return res.redirect(302,u.toString());}

export default async function handler(req,res){
  cors(res);if(req.method==='OPTIONS')return res.status(204).end();
  const route=routeOf(req),base=baseUrl();
  try{
    if(route==='resource'){const resource=`${base}/api/mcp`;return res.status(200).json({resource,authorization_servers:[base],bearer_methods_supported:['header'],scopes_supported:['hub']});}
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
      const v=await validateAuthRequest(p);if(v.error)return failPage(res,400,v.error);
      if(req.method==='GET')return page(res,200,'Connect to Handoff Hub',emailForm(p,v.client));
      if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
      const form=bodyOf(req);
      if(form.decision==='deny')return redirectWith(res,p.redirect_uri,{error:'access_denied',state:p.state});
      const email=str(form.email).trim().toLowerCase();
      if((form.action==='send_email'||form.action==='verify_email')&&!isValidEmail(email)){
        return page(res,400,'Connect to Handoff Hub',emailForm(p,v.client,'Please provide a valid email address.'));
      }
      if(form.action==='send_email'){
        const code=String(crypto.randomInt(100000,1000000));
        await otpDb(`handoff_email_otps?email=eq.${encodeURIComponent(email)}&consumed_at=is.null`,'DELETE');
        const saved=await otpDb('handoff_email_otps','POST',{email,code_hash:crypto.createHash('sha256').update(code).digest('hex'),expires_at:new Date(Date.now()+10*60*1000).toISOString()});
        const sent=await sendOtpEmail(email,code);
        if(!saved.ok)console.error('OTP save failed',{status:saved.status});
        if(!saved.ok||!sent.ok){
          // Do not leave a usable code behind when the email never went out.
          if(saved.ok)await otpDb(`handoff_email_otps?email=eq.${encodeURIComponent(email)}&consumed_at=is.null`,'DELETE');
          const msg=sent.sandbox?'Handoff Hub cannot email verification codes to this address yet: email delivery is still in test mode and only reaches the owner email. Use a portal code instead (generate one in the portal under AI apps), or use the owner email.':'Could not send the verification email. Please try again later, or use a portal code.';
          return page(res,502,'Connect to Handoff Hub',emailForm(p,v.client,msg));
        }
        return page(res,200,'Check your email',emailForm(p,v.client,'A verification code was sent. Enter it below.','otp',email,{info:true}));
      }
      if(form.action==='verify_email'){
        const otp=str(form.otp).trim();
        // The replace choice arrives as mode=replace|add (radio); form.replace==='1' is kept so an older cached page still works.
        const mode=str(form.mode)==='replace'||form.replace==='1'?'replace':str(form.mode)==='add'?'add':'';
        const replace=mode==='replace';
        const unlock=replace?'':str(form.unlock).trim().slice(0,64);
        const now=new Date().toISOString();
        const expectedHash=crypto.createHash('sha256').update(otp).digest('hex');
        const rows=await otpDb(`handoff_email_otps?email=eq.${encodeURIComponent(email)}&code_hash=eq.${encodeURIComponent(expectedHash)}&consumed_at=is.null&expires_at=gt.${encodeURIComponent(now)}&select=id&limit=1`);
        const row=rows.ok&&Array.isArray(rows.data)?rows.data[0]:null;
        if(!row)return page(res,401,'Connect to Handoff Hub',emailForm(p,v.client,'That verification code is invalid or expired.','otp',email,{mode}));
        // Account limit: a second account of the same AI app needs an unlock code (or replaces the old connection). Checked before the code is used up.
        const known=await lookupUser(email);
        if(known){
          const check=await gateClient(known,p.client_id,unlock,replace,false);
          if(!check.ok){
            let msg=check.error||'Adding another account needs an unlock code.';
            if(check.needs_unlock&&!mode)msg='Choose one: replace the old connection, or add this as another account with your unlock code.';
            else if(check.needs_unlock&&mode==='add'&&!unlock)msg='Enter your unlock code to add another account.';
            return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,msg,'otp',email,{gate:Boolean(check.needs_unlock),otp,mode}));
          }
        }
        const consumed=await otpDb(`handoff_email_otps?id=eq.${encodeURIComponent(row.id)}&consumed_at=is.null`,'PATCH',{consumed_at:now});
        if(!consumed.ok)return page(res,409,'Connect to Handoff Hub',emailForm(p,v.client,'That verification code was already used. Please request a new code.','otp',email));
        const userId=await findOrCreateUser(email);
        if(!userId||!(await ensureHubOwner(userId)))return page(res,500,'Connect to Handoff Hub',emailForm(p,v.client,'Could not create your Handoff Hub account. Please try again.','otp',email));
        const applied=await gateClient(userId,p.client_id,unlock,replace,true);
        if(!applied.ok)return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,(applied.error||'Adding another account needs an unlock code.')+' Request a new code to try again.','email'));
        const code=await createAuthCode({client_id:p.client_id,user_id:userId,redirect_uri:p.redirect_uri,code_challenge:p.code_challenge});
        return redirectWith(res,p.redirect_uri,{code,state:p.state});
      }
      if(form.action==='verify_portal'){
        // Portal code path: the code is generated inside a signed-in portal session (portal_link_code), so it proves the portal account without any email.
        const pcode=str(form.pcode).trim().toUpperCase().slice(0,32);
        const mode=str(form.mode)==='replace'?'replace':str(form.mode)==='add'?'add':'';
        const replace=mode==='replace';
        const unlock=replace?'':str(form.unlock).trim().slice(0,64);
        if(!portalAttemptAllowed(req))return page(res,429,'Connect to Handoff Hub',emailForm(p,v.client,'Too many attempts. Wait a few minutes and try again.'));
        const now=new Date().toISOString();
        const hash=crypto.createHash('sha256').update(pcode).digest('hex');
        const pc=pcode?await otpDb(`portal_link_codes?code_hash=eq.${encodeURIComponent(hash)}&used=eq.false&expires_at=gt.${encodeURIComponent(now)}&select=account_id&limit=1`):{ok:false};
        const accountId=pc.ok&&Array.isArray(pc.data)?pc.data[0]?.account_id:null;
        if(!accountId)return page(res,401,'Connect to Handoff Hub',emailForm(p,v.client,'That portal code is invalid or expired. Generate a new one in the portal under AI apps.'));
        // Reuse the Hub account already linked to this portal account; otherwise create one from the portal email.
        const linked=await otpDb(`portal_hub_links?account_id=eq.${encodeURIComponent(accountId)}&select=hub_user_id&order=created_at.asc&limit=1`);
        let userId=linked.ok&&Array.isArray(linked.data)?linked.data[0]?.hub_user_id||null:null;
        if(!userId){
          const acc=await otpDb(`portal_accounts?id=eq.${encodeURIComponent(accountId)}&select=email&limit=1`);
          const pemail=str(acc.ok&&Array.isArray(acc.data)?acc.data[0]?.email:'').trim().toLowerCase();
          if(isValidEmail(pemail))userId=await findOrCreateUser(pemail);
        }
        if(!userId||!(await ensureHubOwner(userId)))return page(res,500,'Connect to Handoff Hub',emailForm(p,v.client,'Could not create your Handoff Hub account. Please try again.'));
        const check=await gateClient(userId,p.client_id,unlock,replace,false);
        if(!check.ok){
          let msg=check.error||'Adding another account needs an unlock code.';
          if(check.needs_unlock&&!mode)msg='Choose one: replace the old connection, or add this as another account with your unlock code.';
          else if(check.needs_unlock&&mode==='add'&&!unlock)msg='Enter your unlock code to add another account.';
          return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,msg,'portal','',{gate:Boolean(check.needs_unlock),pcode,mode}));
        }
        // Consumes the code and links the Hub account to the portal account (same rules as link_portal_account).
        const used=await otpDb('rpc/portal_link_consume','POST',{p_code:pcode,p_hub_user:userId});
        if(!used.ok||!used.data||used.data.ok!==true)return page(res,401,'Connect to Handoff Hub',emailForm(p,v.client,str(used.data?.error)||'That portal code could not be used. Generate a new one in the portal.'));
        const applied=await gateClient(userId,p.client_id,unlock,replace,true);
        if(!applied.ok)return page(res,403,'Connect to Handoff Hub',emailForm(p,v.client,(applied.error||'Adding another account needs an unlock code.')+' Generate a new portal code to try again.'));
        const authCode=await createAuthCode({client_id:p.client_id,user_id:userId,redirect_uri:p.redirect_uri,code_challenge:p.code_challenge});
        return redirectWith(res,p.redirect_uri,{code:authCode,state:p.state});
      }
      return page(res,400,'Connect to Handoff Hub',emailForm(p,v.client,'Start by requesting an email verification code.','email','',{info:true}));
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
  }catch(error){
    console.error('OAuth request failed:',error);
    if(res.headersSent)return;
    // The sign-in page must never show a bare error code: render a readable page instead of JSON.
    if(route==='authorize')return failPage(res,500,'Something went wrong on our side while connecting. Please go back and try again; if it keeps happening, request a new verification code.');
    return res.status(500).json({error:'server_error'});
  }
}

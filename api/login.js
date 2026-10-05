import crypto from 'node:crypto';

const cookieName='hh_login';
const str=v=>typeof v==='string'?v:'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(res,title,body,status=200){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");return res.status(status).send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:system-ui;max-width:420px;margin:12vh auto;padding:24px}input,button{width:100%;padding:12px;margin:8px 0;box-sizing:border-box}button{cursor:pointer}</style></head><body><h1>Handoff Hub</h1>${body}</body></html>`);}
function body(req){if(req.body&&typeof req.body==='object')return req.body;return Object.fromEntries(new URLSearchParams(str(req.body)));}
async function auth(path,data){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)return{ok:false,error:'Email service is not configured.'};const r=await fetch(`${u}/auth/v1/${path}`,{method:'POST',headers:{apikey:k,Authorization:`Bearer ${k}`,'Content-Type':'application/json'},body:JSON.stringify(data)});let d={};try{d=await r.json()}catch{}return{ok:r.ok,data:d,error:d?.msg||d?.message||d?.error_description||d?.error};}
function owner(){return process.env.OAUTH_LOGIN_EMAIL?.trim().toLowerCase()||'';}
export default async function handler(req,res){
 if(req.method==='GET')return html(res,'Handoff Hub Login',`<p>Sign in with your authorised email.</p><form method="post"><input type="hidden" name="action" value="send"><input name="email" type="email" autocomplete="email" placeholder="Email address" required><button>Send verification code</button></form>`);
 if(req.method!=='POST')return res.status(405).end();
 const b=body(req),email=str(b.email).trim().toLowerCase(),allowed=owner();
 if(!allowed)return html(res,'Not configured','<p>Email login is not configured. Set <code>OAUTH_LOGIN_EMAIL</code> in production first.</p>',503);
 if(email!==allowed)return html(res,'Not authorised','<p>This email is not authorised for this temporary login.</p>',403);
 if(b.action==='send'){
  const r=await auth('otp',{email,create_user:true});
  if(!r.ok)return html(res,'Could not send',`<p>${esc(r.error||'Could not send the code.')}</p>`,502);
  return html(res,'Check your email',`<p>Verification code sent to <strong>${esc(email)}</strong>.</p><form method="post"><input type="hidden" name="action" value="verify"><input type="hidden" name="email" value="${esc(email)}"><input name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" required><button>Verify</button></form>`);
 }
 if(b.action==='verify'){
  const r=await auth('verify',{email,token:str(b.otp).trim(),type:'email'});
  if(!r.ok)return html(res,'Invalid code','<p>That code is invalid or expired.</p>',401);
  const token=r.data?.access_token;
  if(!token)return html(res,'Signed in','<p>Email verified successfully. Return to ChatGPT and reconnect Handoff Hub.</p>');
  res.setHeader('Set-Cookie',`${cookieName}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
  return html(res,'Signed in','<p>Email verified successfully. You are signed in to the temporary Handoff Hub website.</p><p>You can now return to ChatGPT and reconnect the connector.</p>');
 }
 return html(res,'Handoff Hub Login','<p>Invalid request.</p>',400);
}
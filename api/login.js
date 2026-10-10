import crypto from 'node:crypto';

const cookieName='hh_login';
const str=v=>typeof v==='string'?v:'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CSS=`
:root{color-scheme:dark;--bg:#000000;--card:#0a0a0a;--sub:#121212;--fg:#ededed;--mut:#a1a1a1;--soft:#707070;--line:rgba(255,255,255,.08);--line-mid:rgba(255,255,255,.16);--acc:#60eca8;--acc-hover:#3ecf8e;--err:#ff7b7b}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--bg);color:var(--fg);font-family:Geist,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;display:grid;place-items:center;padding:24px}
a{color:var(--acc);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{width:100%;max-width:420px}
.brand{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:600;letter-spacing:-.02em;margin-bottom:24px;color:var(--fg)}
.logo{width:32px;height:32px;border-radius:8px;background:#2a2a2a;border:1px solid var(--line);color:var(--acc);display:grid;place-items:center;font-weight:700;font-size:15px}
.chip{display:inline-block;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--soft);margin-bottom:8px}
.card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:32px 28px}
h1{margin:0 0 8px;font-size:22px;letter-spacing:-.03em;font-weight:600;color:var(--fg)}
.sub{margin:0 0 24px;color:var(--mut);font-size:13px;line-height:1.6}
.sub strong{color:var(--fg);font-weight:600}
label{display:block;font-size:12px;color:var(--mut);font-weight:500;margin-bottom:6px}
input{display:block;width:100%;height:40px;margin-bottom:16px;padding:0 12px;border-radius:8px;border:1px solid var(--line-mid);background:var(--sub);color:var(--fg);font-family:inherit;font-size:14px;outline:none;transition:border-color .2s}
input::placeholder{color:var(--soft)}
input:focus{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}
input[name=otp]{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Consolas,monospace;text-align:center;letter-spacing:.4em;font-size:18px}
.btn{width:100%;height:40px;border:0;border-radius:8px;background:var(--acc);color:#0a0a0a;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;margin-top:8px}
.btn:hover{background:var(--acc-hover)}
.btn.loading{opacity:.7;pointer-events:none}
.back{display:block;margin-top:16px;text-align:center;font-size:12px;color:var(--mut)}
.back:hover{color:var(--fg)}
.portal-link{margin-top:20px;padding-top:16px;border-top:1px solid var(--line);text-align:center;font-size:12px;color:var(--mut)}
.foot{margin-top:24px;text-align:center;color:var(--soft);font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}
`;

const JS=`
document.querySelectorAll('form').forEach(function(f){f.addEventListener('submit',function(){var b=f.querySelector('button');if(b){b.classList.add('loading');b.innerText='Processing...';setTimeout(function(){b.disabled=true},0)}})});
var i=document.querySelector('input:not([type=hidden])');if(i)i.focus();
`;

const btn=label=>`<button class="btn" type="submit">${label}</button>`;
const retry='<a class="back" href="/login">&larr; Back to sign in</a>';
const portalLink='<p class="portal-link"><a href="https://handoff-portal.vercel.app" target="_blank" rel="noopener">Manage integrations in the portal &rarr;</a></p>';

function html(res,title,body,status=200){
 const nonce=crypto.randomBytes(16).toString('base64');
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'`);
 return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#000000"><title>${esc(title)}</title><style>${CSS}</style></head><body><main class="wrap"><div class="brand"><span class="logo">H</span>Handoff Hub</div><section class="card">${body}</section><p class="foot">HANDOFF HUB // SECURITY ENGINE</p></main><script nonce="${nonce}">${JS}</script></body></html>`);
}
function body(req){if(req.body&&typeof req.body==='object')return req.body;return Object.fromEntries(new URLSearchParams(str(req.body)));}
async function auth(path,data){const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)return{ok:false,error:'Email service is not configured.'};const r=await fetch(`${u}/auth/v1/${path}`,{method:'POST',headers:{apikey:k,Authorization:`Bearer ${k}`,'Content-Type':'application/json'},body:JSON.stringify(data)});let d={};try{d=await r.json()}catch{}return{ok:r.ok,data:d,error:d?.msg||d?.message||d?.error_description||d?.error};}
async function ensureHubOwner(userId){
 const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k||!userId)return false;
 const h={apikey:k,Authorization:`Bearer ${k}`};
 const r=await fetch(`${u}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`,{headers:h});if(!r.ok)return false;
 const rows=await r.json();if(rows?.[0]?.user_id)return true;
 const c=await fetch(`${u}/rest/v1/handoff_state`,{method:'POST',headers:{...h,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:userId,user_id:userId,state:{projects:{},memories:[],events:[]},version:0,updated_at:new Date().toISOString()})});return c.ok||c.status===409;
}
export default async function handler(req,res){
 if(req.method==='GET')return html(res,'Handoff Hub Login',`<span class="chip">AUTHENTICATION // EMAIL OTP</span><h1>Welcome back</h1><p class="sub">Sign in with your authorized email address to receive a one-time code.</p><form method="post"><input type="hidden" name="action" value="send"><label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>${btn('Send verification code')}</form>`);
 if(req.method!=='POST')return res.status(405).end();
 const b=body(req),email=str(b.email).trim().toLowerCase();
 if(b.action==='send'){
  const r=await auth('otp',{email,create_user:true});
  if(!r.ok)return html(res,'Could not send',`<span class="chip">AUTHENTICATION // ERROR</span><h1>Could not send code</h1><p class="sub">${esc(r.error||'Could not send verification email.')}</p>${retry}`,502);
  return html(res,'Check your email',`<span class="chip">AUTHENTICATION // VERIFY</span><h1>Check your email</h1><p class="sub">We sent a verification code to <strong>${esc(email)}</strong>.</p><form method="post"><input type="hidden" name="action" value="verify"><input type="hidden" name="email" value="${esc(email)}"><label>Verification code<input name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" required></label>${btn('Verify and continue')}</form>${retry}`);
 }
 if(b.action==='verify'){
  const r=await auth('verify',{email,token:str(b.otp).trim(),type:'email'});
  if(!r.ok)return html(res,'Invalid code',`<span class="chip">AUTHENTICATION // ERROR</span><h1>Invalid code</h1><p class="sub">That verification code is invalid or expired.</p>${retry}`,401);
  const userId=r.data?.user?.id;
  if(!userId||!(await ensureHubOwner(userId)))return html(res,'Could not create account',`<span class="chip">AUTHENTICATION // ERROR</span><h1>Something went wrong</h1><p class="sub">Could not set up your Handoff Hub account. Please try again.</p>${retry}`,500);
  const token=r.data?.access_token;
  if(!token)return html(res,'Signed in',`<span class="chip">AUTHENTICATION // SUCCESS</span><h1>Email verified</h1><p class="sub">Your email was verified successfully. You can now return to your AI assistant.</p>${portalLink}`);
  res.setHeader('Set-Cookie',`${cookieName}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
  return html(res,'Signed in',`<span class="chip">AUTHENTICATION // SUCCESS</span><h1>You are signed in</h1><p class="sub">Email verified successfully. You can now return to your AI assistant or manage your workspace.</p>${portalLink}`);
 }
 return html(res,'Handoff Hub Login','<span class="chip">AUTHENTICATION // ERROR</span><h1>Invalid request</h1><p class="sub">An error occurred with that request.</p>'+retry,400);
}

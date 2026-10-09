import crypto from 'node:crypto';

const cookieName='hh_login';
const str=v=>typeof v==='string'?v:'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CSS=`
@view-transition{navigation:auto}
:root{color-scheme:dark;--fg:#ededed;--mut:#8f8f8f;--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.18);--acc:#3ecf8e;--acc2:#5eead4;--ease:cubic-bezier(.22,1,.36,1)}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#000;color:var(--fg);font-family:Inter,Geist,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;display:grid;place-items:center;padding:24px;overflow-x:hidden;animation:pagein .6s var(--ease) both}
@keyframes pagein{from{opacity:0}to{opacity:1}}
a{color:inherit;text-decoration:none}
body::before{content:'';position:fixed;inset:0;z-index:-2;background:radial-gradient(55% 45% at 50% 0%,rgba(62,207,142,.16),transparent 70%)}
body::after{content:'';position:fixed;inset:0;z-index:-1;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:56px 56px;-webkit-mask-image:radial-gradient(60% 50% at 50% 0%,#000,transparent 75%);mask-image:radial-gradient(60% 50% at 50% 0%,#000,transparent 75%);animation:gridmove 24s linear infinite}
@keyframes gridmove{to{background-position:56px 56px,56px 56px}}
.topbar{position:fixed;top:0;left:0;height:2px;width:100%;background:linear-gradient(90deg,transparent,var(--acc),var(--acc2));transform-origin:left;animation:bar 1s var(--ease) both;pointer-events:none}
@keyframes bar{0%{transform:scaleX(0);opacity:1}70%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}
.busy .topbar{animation:busy 1.6s var(--ease) infinite}
@keyframes busy{0%{transform:scaleX(0);transform-origin:left;opacity:1}50%{transform:scaleX(1);transform-origin:left}51%{transform-origin:right}100%{transform:scaleX(0);transform-origin:right;opacity:1}}
.wrap{width:100%;max-width:400px}
.brand{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:650;letter-spacing:-.02em;margin-bottom:28px;animation:up .8s var(--ease) .05s both}
.logo{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#fff,#a8a8a8);color:#000;display:grid;place-items:center;font-weight:800;font-size:15px;transition:transform .5s var(--ease)}
.brand:hover .logo{transform:rotate(-12deg) scale(1.08)}
@keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.card{--x:50%;--y:50%;position:relative;background:#0a0a0a;border:1px solid var(--line);border-radius:18px;padding:32px 28px;overflow:hidden;animation:up .9s var(--ease) .15s both;box-shadow:0 40px 120px -50px rgba(62,207,142,.35)}
.card::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:radial-gradient(260px circle at var(--x) var(--y),rgba(62,207,142,.8),transparent 60%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s;pointer-events:none}
.card:hover::before{opacity:1}
h1{margin:0 0 8px;font-size:24px;letter-spacing:-.03em;font-weight:700}
.sub{margin:0 0 26px;color:var(--mut);font-size:14.5px;line-height:1.6}
.sub strong{color:var(--fg);font-weight:600}
label{display:block;font-size:12.5px;color:#b5b5b5;font-weight:500}
input{display:block;width:100%;height:46px;margin:8px 0 16px;padding:0 14px;border-radius:10px;border:1px solid var(--line2);background:#000;color:var(--fg);font:inherit;font-size:15px;outline:none;transition:border-color .25s,box-shadow .25s,background .25s}
input::placeholder{color:#555}
input:focus{border-color:var(--acc);box-shadow:0 0 0 4px rgba(62,207,142,.14);background:#050505}
input[name=otp]{text-align:center;letter-spacing:.5em;font-size:20px;font-variant-numeric:tabular-nums;text-indent:.5em}
.btn{position:relative;overflow:hidden;width:100%;height:46px;border:0;border-radius:10px;background:#fff;color:#000;font:inherit;font-size:14.5px;font-weight:650;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .25s var(--ease),box-shadow .25s,background .25s}
.btn:hover{background:#e8e8e8;box-shadow:0 10px 40px -10px rgba(62,207,142,.55)}
.btn:active{transform:scale(.98)}
.btn::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.75) 50%,transparent 70%);transform:translateX(-120%);transition:transform .8s var(--ease)}
.btn:hover::after{transform:translateX(120%)}
.btn .t{transition:opacity .2s,transform .3s var(--ease)}
.spin{position:absolute;width:18px;height:18px;border-radius:50%;border:2px solid rgba(0,0,0,.2);border-top-color:#000;opacity:0;transform:scale(.6);transition:opacity .2s,transform .3s var(--ease);animation:rot .7s linear infinite}
@keyframes rot{to{rotate:360deg}}
.btn.loading .t{opacity:0;transform:translateY(-8px)}
.btn.loading .spin{opacity:1;transform:none}
.btn:disabled{cursor:progress}
.back{display:block;margin-top:18px;text-align:center;font-size:13.5px;color:var(--mut);transition:color .2s}
.back:hover{color:var(--fg)}
.ok{width:48px;height:48px;border-radius:50%;border:1px solid var(--acc);display:grid;place-items:center;margin-bottom:20px;box-shadow:0 0 40px -6px rgba(62,207,142,.55);animation:pop .7s var(--ease) .25s both}
.ok svg{width:22px;height:22px;fill:none;stroke:var(--acc);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:26;stroke-dashoffset:26;animation:draw .6s var(--ease) .6s forwards}
.err{border-color:#ef4444;box-shadow:0 0 40px -6px rgba(239,68,68,.45)}
.err svg{stroke:#ef4444}
@keyframes pop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:none}}
@keyframes draw{to{stroke-dashoffset:0}}
.foot{margin-top:22px;text-align:center;color:#555;font-size:12.5px;animation:up .9s var(--ease) .35s both}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

const JS=`
document.querySelectorAll('form').forEach(function(f){f.addEventListener('submit',function(){var b=f.querySelector('button');if(b){b.classList.add('loading');setTimeout(function(){b.disabled=true},0)}document.documentElement.classList.add('busy')})});
var i=document.querySelector('input:not([type=hidden])');if(i)i.focus();
var c=document.querySelector('.card');if(c)c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--x',(e.clientX-r.left)+'px');c.style.setProperty('--y',(e.clientY-r.top)+'px')});
window.addEventListener('pageshow',function(){document.documentElement.classList.remove('busy');document.querySelectorAll('button.loading').forEach(function(b){b.classList.remove('loading');b.disabled=false})});
`;

const okIcon='<div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>';
const errIcon='<div class="ok err"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></div>';
const btn=label=>`<button class="btn"><span class="t">${label}</span><i class="spin"></i></button>`;
const retry='<a class="back" href="/login">← Back to sign in</a>';

function html(res,title,body,status=200){
 const nonce=crypto.randomBytes(16).toString('base64');
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'`);
 return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#000000"><title>${esc(title)}</title><style>${CSS}</style></head><body><div class="topbar"></div><main class="wrap"><a class="brand" href="/"><span class="logo">H</span>Handoff Hub</a><section class="card">${body}</section><p class="foot">Secure context handoff for AI workflows</p></main><script nonce="${nonce}">${JS}</script></body></html>`);
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
 if(req.method==='GET')return html(res,'Handoff Hub Login',`<h1>Welcome back</h1><p class="sub">Sign in with your authorised email and we'll send you a one-time code.</p><form method="post"><input type="hidden" name="action" value="send"><label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>${btn('Send verification code')}</form>`);
 if(req.method!=='POST')return res.status(405).end();
 const b=body(req),email=str(b.email).trim().toLowerCase();
 if(b.action==='send'){
  const r=await auth('otp',{email,create_user:true});
  if(!r.ok)return html(res,'Could not send',`${errIcon}<h1>Could not send the code</h1><p class="sub">${esc(r.error||'Could not send the code.')}</p>${retry}`,502);
  return html(res,'Check your email',`<h1>Check your email</h1><p class="sub">We sent a verification code to <strong>${esc(email)}</strong>.</p><form method="post"><input type="hidden" name="action" value="verify"><input type="hidden" name="email" value="${esc(email)}"><label>Verification code<input name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" required></label>${btn('Verify and continue')}</form>${retry}`);
 }
 if(b.action==='verify'){
  const r=await auth('verify',{email,token:str(b.otp).trim(),type:'email'});
  if(!r.ok)return html(res,'Invalid code',`${errIcon}<h1>Invalid code</h1><p class="sub">That code is invalid or expired.</p>${retry}`,401);
  const userId=r.data?.user?.id;
  if(!userId||!(await ensureHubOwner(userId)))return html(res,'Could not create account',`${errIcon}<h1>Something went wrong</h1><p class="sub">Could not create your Handoff Hub account. Please try again.</p>${retry}`,500);
  const token=r.data?.access_token;
  if(!token)return html(res,'Signed in',`${okIcon}<h1>You're verified</h1><p class="sub">Email verified successfully. Return to ChatGPT and reconnect Handoff Hub.</p>`);
  res.setHeader('Set-Cookie',`${cookieName}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
  return html(res,'Signed in',`${okIcon}<h1>You're signed in</h1><p class="sub">Email verified successfully. You are signed in to the temporary Handoff Hub website.</p><p class="sub">You can now return to ChatGPT and reconnect the connector.</p>`);
 }
 return html(res,'Handoff Hub Login','<h1>Invalid request</h1><p class="sub">Something about that request was off.</p>'+retry,400);
}

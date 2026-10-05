"use client";

import { useEffect, useState } from "react";

const apps=[
 {id:"github",name:"GitHub",tag:"Development",icon:"GH",description:"Repositories and development access.",enabled:false},
 {id:"canva",name:"Canva",tag:"Design",icon:"C",description:"Designs and creative workspace access.",enabled:true},
 {id:"vercel",name:"Vercel",tag:"Deployments",icon:"▲",description:"Projects, deployments and hosting.",enabled:false},
];

export default function Home(){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[mode,setMode]=useState<"login"|"signup">("login");const[user,setUser]=useState<any>(null);const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/account").then(r=>r.ok?r.json():null).then(d=>d?.user&&setUser(d.user)).catch(()=>{})},[]);
 async function auth(){setMessage("");const e=email.trim().toLowerCase();if(!e||!password)return setMessage("Enter your email and password.");setBusy(true);try{const r=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:mode,email:e,password})});const d=await r.json().catch(()=>({}));if(!r.ok){setMessage(d.error||"Could not sign in.");return;}setUser(d.user);setMessage(mode==="signup"?"Account created. You are signed in.":"Signed in.");}catch{setMessage("Could not reach the account service.")}finally{setBusy(false)}}
 async function connect(app:any){setMessage("");if(!user)return setMessage("Sign in first.");if(!app.enabled)return setMessage(app.name+" connection is not enabled yet. It will not pretend to be connected.");if(app.id==="canva"){const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)return setMessage("Your session expired. Sign in again.");setBusy(true);try{const r=await fetch("/api/canva/oauth/start",{headers:{Authorization:"Bearer "+token}});const p=await r.json().catch(()=>({}));if(!r.ok||!p.authorization_url)return setMessage(p.error||"Canva connection is not configured.");window.location.href=p.authorization_url}catch{setMessage("Could not start the Canva connection.")}finally{setBusy(false)}}}
 return <main className="shell">
  <aside className="side"><a className="brand" href="/"><span className="logo">H</span><span>Handoff Hub</span></a>
   <nav><a className="nav active" href="#overview">Overview</a><a className="nav" href="#connections">Connections</a><a className="nav" href="#security">Security</a></nav>
   <div className="sideFoot"><span className="liveDot"/>Secure account portal</div>
  </aside>
  <section className="main">
   <header className="bar"><div><span className="kicker">ACCOUNT PORTAL</span><h1>Connections</h1></div>{user?<div className="userChip"><span className="avatar">{(user.email||"U")[0].toUpperCase()}</span><span>{user.email}</span><button onClick={async()=>{await fetch("/api/account",{method:"DELETE"});setUser(null)}}>Sign out</button></div>:<span className="status">Not signed in</span>}</header>
   <div className="content" id="overview">
    {!user?<section className="welcome"><div><span className="kicker">HANDOFF</span><h2>One account.<br/><span>Every connection.</span></h2><p>Enter your email and use the secure link we send you. No password or OTP is required. We never ask for third-party passwords or API keys here.</p></div>
      <div className="authCard"><div className="switch"><button className={mode==="login"?"on":""} onClick={()=>{setMode("login");setMessage("")}}>Sign in</button><button className={mode==="signup"?"on":""} onClick={()=>{setMode("signup");setMessage("")}}>Create account</button></div><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label><button className="primary" disabled={busy} onClick={auth}>{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}</button>{message&&<div className="notice">{message}</div>}</div>
    </section>:<section className="welcome signed"><div><span className="kicker">WELCOME BACK</span><h2>Your workspace<br/><span>is ready.</span></h2><p>Choose a service below to start an official authorization flow.</p></div><div className="sessionCard"><span className="liveDot"/>Signed in securely<div className="email">{user.email}</div><small>Account session active</small></div></section>}
    <section id="connections" className="connections"><div className="sectionTitle"><div><span className="kicker">SERVICES</span><h2>Connect apps</h2></div><span className="count">3 services</span></div><div className="grid">{apps.map(a=><article className="card" key={a.id}><div className="cardTop"><div className="appIcon">{a.icon}</div><span className={a.enabled?"ready":"soon"}>{a.enabled?"Available":"Coming soon"}</span></div><div className="tag">{a.tag}</div><h3>{a.name}</h3><p>{a.description}</p><button className="connect" disabled={!user||busy} onClick={()=>connect(a)}>{!user?"Sign in to connect":a.enabled?(busy?"Opening…":"Connect"): "Coming soon"}</button></article>)}</div></section>
    <section id="security" className="security"><span className="shield">✓</span><div><strong>Built for safe authorization</strong><p>Third-party access is granted on the service's own authorization page. Your passwords stay with their provider.</p></div></section>
   </div>
  </section>
 </main>
}
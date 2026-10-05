"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const apps=[
 {id:"github",name:"GitHub",tag:"Development",icon:"GH",description:"Repositories and development access.",enabled:false},
 {id:"canva",name:"Canva",tag:"Design",icon:"C",description:"Designs and creative workspace access.",enabled:true},
 {id:"vercel",name:"Vercel",tag:"Deployments",icon:"▲",description:"Projects, deployments and hosting.",enabled:false},
];

export default function Home(){
 const[email,setEmail]=useState("");const[user,setUser]=useState<any>(null);const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));return()=>data.subscription.unsubscribe()},[]);
 async function auth(){setMessage("");const e=email.trim().toLowerCase();if(!e)return setMessage("Enter your email address.");setBusy(true);const r=await supabase.auth.signInWithOtp({email:e,options:{emailRedirectTo:window.location.origin}});setBusy(false);if(r.error)return setMessage(r.error.message);setMessage("Check your email for the secure sign-in link.");}
 async function connect(app:any){setMessage("");if(!user)return setMessage("Sign in first.");if(!app.enabled)return setMessage(app.name+" connection is not enabled yet. It will not pretend to be connected.");if(app.id==="canva"){const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)return setMessage("Your session expired. Sign in again.");setBusy(true);try{const r=await fetch("/api/canva/oauth/start",{headers:{Authorization:"Bearer "+token}});const p=await r.json().catch(()=>({}));if(!r.ok||!p.authorization_url)return setMessage(p.error||"Canva connection is not configured.");window.location.href=p.authorization_url}catch{setMessage("Could not start the Canva connection.")}finally{setBusy(false)}}}
 return <main className="shell">
  <aside className="side"><a className="brand" href="/"><span className="logo">H</span><span>Handoff Hub</span></a>
   <nav><a className="nav active" href="#overview">Overview</a><a className="nav" href="#connections">Connections</a><a className="nav" href="#security">Security</a></nav>
   <div className="sideFoot"><span className="liveDot"/>Secure account portal</div>
  </aside>
  <section className="main">
   <header className="bar"><div><span className="kicker">ACCOUNT PORTAL</span><h1>Connections</h1></div>{user?<div className="userChip"><span className="avatar">{(user.email||"U")[0].toUpperCase()}</span><span>{user.email}</span><button onClick={async()=>{await supabase.auth.signOut();setUser(null)}}>Sign out</button></div>:<span className="status">Not signed in</span>}</header>
   <div className="content" id="overview">
    {!user?<section className="welcome"><div><span className="kicker">HANDOFF</span><h2>One account.<br/><span>Every connection.</span></h2><p>Enter your email and use the secure link we send you. No password or OTP is required. We never ask for third-party passwords or API keys here.</p></div>
      <div className="authCard"><div className="emailLogin"><span className="mailIcon">@</span><div><strong>Continue with email</strong><p>We’ll send a secure sign-in link to your inbox.</p></div></div><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="primary" disabled={busy} onClick={auth}>{busy?"Sending…":"Send sign-in link"}</button>{message&&<div className="notice">{message}</div>}</div>
    </section>:<section className="welcome signed"><div><span className="kicker">WELCOME BACK</span><h2>Your workspace<br/><span>is ready.</span></h2><p>Choose a service below to start an official authorization flow.</p></div><div className="sessionCard"><span className="liveDot"/>Signed in securely<div className="email">{user.email}</div><small>Account session active</small></div></section>}
    <section id="connections" className="connections"><div className="sectionTitle"><div><span className="kicker">SERVICES</span><h2>Connect apps</h2></div><span className="count">3 services</span></div><div className="grid">{apps.map(a=><article className="card" key={a.id}><div className="cardTop"><div className="appIcon">{a.icon}</div><span className={a.enabled?"ready":"soon"}>{a.enabled?"Available":"Coming soon"}</span></div><div className="tag">{a.tag}</div><h3>{a.name}</h3><p>{a.description}</p><button className="connect" disabled={!user||busy} onClick={()=>connect(a)}>{!user?"Sign in to connect":a.enabled?(busy?"Opening…":"Connect"): "Coming soon"}</button></article>)}</div></section>
    <section id="security" className="security"><span className="shield">✓</span><div><strong>Built for safe authorization</strong><p>Third-party access is granted on the service's own authorization page. Your passwords stay with their provider.</p></div></section>
   </div>
  </section>
 </main>
}
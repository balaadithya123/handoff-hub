"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

const apps = [
  { id:"github", name:"GitHub", icon:"GH", description:"Repositories, commits and development workflows.", configured:true },
  { id:"canva", name:"Canva", icon:"C", description:"Designs and creative workspace access.", configured:false },
  { id:"vercel", name:"Vercel", icon:"▲", description:"Projects, deployments and hosting.", configured:false },
];

export default function Home(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [user,setUser]=useState<any>(null); const [mode,setMode]=useState<"login"|"signup">("login");
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user));
    const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));
    return()=>data.subscription.unsubscribe();
  },[]);

  async function auth(){
    setMessage("");
    if(!email || !password){setMessage("Enter your email and password.");return}
    if(password.length < 6){setMessage("Password must be at least 6 characters.");return}
    setBusy(true);
    const result = mode==="signup" ? await supabase.auth.signUp({email,password}) : await supabase.auth.signInWithPassword({email,password});
    setBusy(false);
    if(result.error){setMessage(result.error.message);return}
    if(mode==="signup" && !result.data.session) setMessage("Account created. If email confirmation is enabled, confirm it before signing in.");
    else { setUser(result.data.user); setMessage(mode==="signup" ? "Account created and signed in." : "Signed in."); }
  }

  function connect(app:any){
    if(!user){setMessage("Sign in first.");return}
    if(!app.configured){setMessage(app.name+" OAuth is not configured on the Handoff Hub yet.");return}
    setMessage("Starting "+app.name+" authorization…");
    window.location.href=`${process.env.NEXT_PUBLIC_HUB_URL}/oauth/${app.id}/authorize?return_to=${encodeURIComponent(window.location.origin)}`;
  }

  async function logout(){await supabase.auth.signOut();setUser(null);setMessage("Signed out.");}

  return <main>
    <header className="top"><div className="brand"><span className="mark">H</span>Handoff</div><span className="pill">Integration Portal</span></header>
    <section className="hero"><div className="eyebrow">SECURE APP CONNECTIONS</div><h1>Connect your apps<br/><em>for real.</em></h1>
      <p>Use an account to access the portal, then authorize each service through its official OAuth screen. No app passwords are collected here.</p>
      {!user ? <div className="login">
        <div className="tabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Create account</button></div>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com"/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (6+ characters)"/>
        <button disabled={busy} onClick={auth}>{busy?"Working…":mode==="login"?"Sign in →":"Create account →"}</button>
      </div> : <div className="signed">Signed in as <b>{user.email}</b><button onClick={logout}>Sign out</button></div>}
      {message&&<div className="notice">{message}</div>}
    </section>
    <section className="apps"><div className="sectionHead"><div><span className="eyebrow">INTEGRATIONS</span><h2>Available apps</h2></div></div>
      <div className="grid">{apps.map(app=><article className="card" key={app.id}><div className="appIcon">{app.icon}</div><div className="cardBody"><h3>{app.name}</h3><p>{app.description}</p></div><button disabled={!user||!app.configured} onClick={()=>connect(app)}>{!app.configured?"Setup required":user?"Connect":"Sign in first"}</button></article>)}</div>
    </section>
    <footer><span>Handoff Hub</span><span>OAuth tokens stay server-side · No app passwords collected</span></footer>
  </main>
}

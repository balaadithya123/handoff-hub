"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const apps = [
  { id:"github", name:"GitHub", icon:"GH", description:"Repositories, commits and development workflows.", configured:true },
  { id:"canva", name:"Canva", icon:"C", description:"Designs and creative workspace access.", configured:false },
  { id:"vercel", name:"Vercel", icon:"▲", description:"Projects, deployments and hosting.", configured:false },
];

export default function Home(){
 const [email,setEmail]=useState(""); const [user,setUser]=useState<any>(null);
 const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null)); return()=>data.subscription.unsubscribe()},[]);
 async function login(){setMessage(""); if(!email){setMessage("Enter your email.");return} setBusy(true); const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}}); setBusy(false); setMessage(error?error.message:"Check your email for the secure sign-in link.");}
 async function connect(app:any){ if(!user){setMessage("Sign in with email first.");return} if(!app.configured){setMessage(app.name+" OAuth is not configured on the Handoff Hub yet.");return} setMessage("Starting "+app.name+" authorization…"); window.location.href=`${process.env.NEXT_PUBLIC_HUB_URL}/oauth/${app.id}/authorize?return_to=${encodeURIComponent(window.location.origin)}`; }
 async function logout(){await supabase.auth.signOut();setUser(null)}
 return <main><header className="top"><div className="brand"><span className="mark">H</span>Handoff</div><span className="pill">Integration Portal</span></header>
 <section className="hero"><div className="eyebrow">SECURE APP CONNECTIONS</div><h1>Connect your apps<br/><em>for real.</em></h1><p>Sign in with your email, then authorize each service through its official OAuth screen. No credentials are collected by this portal.</p>
 {!user?<div className="login"><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com"/><button disabled={busy} onClick={login}>{busy?"Sending…":"Email me a sign-in link →"}</button></div>:<div className="signed">Signed in as <b>{user.email}</b><button onClick={logout}>Sign out</button></div>}
 {message&&<div className="notice">{message}</div>}</section>
 <section className="apps"><div className="sectionHead"><div><span className="eyebrow">INTEGRATIONS</span><h2>Available apps</h2></div></div><div className="grid">{apps.map(app=><article className="card" key={app.id}><div className="appIcon">{app.icon}</div><div className="cardBody"><h3>{app.name}</h3><p>{app.description}</p></div><button disabled={!user||!app.configured} onClick={()=>connect(app)}>{!app.configured?"Setup required":user?"Connect":"Sign in first"}</button></article>)}</div></section>
 <footer><span>Handoff Hub</span><span>OAuth tokens stay server-side · No passwords collected</span></footer></main>
}
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback(){
 const router=useRouter(); const [error,setError]=useState("");
 useEffect(()=>{
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{flowType:"pkce",detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
  (async()=>{
   const params=new URLSearchParams(window.location.search);
   const code=params.get("code");
   if(code){
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(error){setError(error.message);return;}
   }
   const {data}=await supabase.auth.getSession();
   if(data.session){router.replace("/");return;}
   setError("The sign-in link could not create a session. Please request a new link.");
  })();
 },[router]);
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#090b0f",color:"#fff",fontFamily:"system-ui",padding:24}}>
  <div style={{maxWidth:460,textAlign:"center"}}><h1>{error?"Sign-in link failed":"Signing you in…"}</h1><p style={{color:"#9aa2af"}}>{error||"Please wait while we securely complete your sign-in."}</p>{error&&<a href="/" style={{color:"#fff"}}>Back to sign in</a>}</div>
 </main>
}
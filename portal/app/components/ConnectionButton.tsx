"use client";
import {useState} from "react";

export default function ConnectionButton({provider,connected}:{provider:string;connected:boolean}){
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState("");
  if(!connected)return <a className="connect" href={"/api/connect/"+provider}>Connect</a>;
  async function disconnect(){
    setBusy(true);setError("");
    const r=await fetch("/api/disconnect/"+provider,{method:"POST"});
    if(r.ok)window.location.reload();
    else{setError("Could not disconnect.");setBusy(false);}
  }
  return <div><button className="connect connected" onClick={disconnect} disabled={busy}>{busy?"Disconnecting…":"Connected · Disconnect"}</button>{error&&<small>{error}</small>}</div>;
}

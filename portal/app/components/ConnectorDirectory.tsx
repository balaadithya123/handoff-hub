"use client";
import {useEffect,useState} from "react";

type Server={name?:string;description?:string;version?:string;repository?:{url?:string};packages?:Array<{registryType?:string;identifier?:string;transport?:{type?:string;url?:string}}>;remotes?:Array<{type?:string;url?:string}>};
export default function ConnectorDirectory(){
  const[q,setQ]=useState(""); const[data,setData]=useState<Server[]>([]); const[loading,setLoading]=useState(true); const[error,setError]=useState("");
  async function load(term=""){
    setLoading(true);setError("");
    try{const r=await fetch("/api/registry?limit=30&search="+encodeURIComponent(term),{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d.servers||[]);}
    catch(e){setError(e instanceof Error?e.message:"Could not load connectors");setData([])}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);
  return <section className="directory">
    <div className="directoryHead"><div><span className="eyebrow">MCP Registry</span><h2>Connect hundreds of tools</h2><p>Search the public MCP catalog. Handoff Hub will use native OAuth where the provider supports it.</p></div><form onSubmit={e=>{e.preventDefault();load(q)}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search GitHub, Notion, Slack…" /><button>Search</button></form></div>
    {loading?<div className="registryState">Loading connectors…</div>:error?<div className="notice error">{error}</div>:<div className="registryGrid">{data.map((s,i)=>{const name=s.name||"Unnamed connector";const remote=Boolean(s.remotes?.length);return <article className="registryCard" key={name+i}><div className="registryIcon">{name.split(/[./]/).pop()?.slice(0,2).toUpperCase()}</div><div className="registryBody"><div className="registryTitle"><h3>{name}</h3><span>{s.version||"latest"}</span></div><p>{s.description||"MCP connector"}</p><div className="registryMeta"><span>{remote?"Remote":"Package"}</span>{s.repository?.url&&<a href={s.repository.url} target="_blank" rel="noreferrer">Source</a>}</div></div><button className="connect registryConnect" disabled={!remote} title={remote?"OAuth-capable remote connector":"This catalog entry is a local/package server and needs provider-specific hosting"}>{remote?"Connect":"Catalog"}</button></article>})}</div>}
  </section>
}

"use client";
import {useEffect,useState} from "react";

type Server={name?:string;title?:string;description?:string;version?:string;repository?:{url?:string};remotes?:Array<{type?:string;url?:string}>};

function displayName(s:Server){
  if(s.title?.trim()) return s.title.trim();
  if(s.name?.trim()){
    const n=s.name.trim().replace(/^io\.(github|gitlab|cloud)\./i,"").replace(/^[^/]+\//,"");
    return n.split(/[.:]/).filter(Boolean).pop()||n;
  }
  return "";
}

export default function ConnectorDirectory(){
  const[q,setQ]=useState("");
  const[data,setData]=useState<Server[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");

  async function load(term=""){
    setLoading(true);setError("");
    try{
      const r=await fetch("/api/registry?limit=100&search="+encodeURIComponent(term),{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error);
      const servers=(d.servers||[]).filter((s:Server)=>displayName(s)&&Boolean(s.remotes?.some(x=>x.url)));
      setData(servers);
    }catch(e){
      setError(e instanceof Error?e.message:"Could not load connectors");
      setData([]);
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  return <section className="directory">
    <div className="directoryHead">
      <div><span className="eyebrow">Connectors</span><h2>Connect your tools</h2><p>Only remote MCP connectors that can be reached by Handoff Hub are shown here.</p></div>
      <form onSubmit={e=>{e.preventDefault();load(q)}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search GitHub, Notion, Slack…" /><button>Search</button></form>
    </div>
    {loading?<div className="registryState">Loading connectors…</div>:error?<div className="notice error">{error}</div>:data.length===0?<div className="registryState">No connectable remote connectors found.</div>:
      <div className="registryGrid">{data.map((s,i)=>{
        const name=displayName(s);
        const url=s.remotes?.find(x=>x.url)?.url;
        return <article className="registryCard" key={s.name||name+i}>
          <div className="registryIcon">{name.slice(0,2).toUpperCase()}</div>
          <div className="registryBody"><div className="registryTitle"><h3>{name}</h3><span>{s.version||"latest"}</span></div><p>{s.description||"Remote MCP connector."}</p><div className="registryMeta"><span>Remote</span></div></div>
          <a className="connect registryConnect" href={url} target="_blank" rel="noreferrer">Connect</a>
        </article>
      })}</div>}
  </section>
}

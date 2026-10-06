"use client";
import ConnectionButton from "./ConnectionButton";

const apps=[
  {id:"github",name:"GitHub",group:"Developer tools",icon:"GH",desc:"Repositories, branches, issues and development workflows."},
  {id:"canva",name:"Canva",group:"Design",icon:"Ca",desc:"Connect your Canva workspace for design workflows."},
  {id:"vercel",name:"Vercel",group:"Infrastructure",icon:"▲",desc:"Connect your Vercel account for deployments and projects."},
  {id:"supabase",name:"Supabase",group:"Data",icon:"Sb",desc:"Connect projects, databases and edge functions."}
];

export default function ConnectorDirectory({connected}:{connected:Set<string>}){
 return <section className="appsSection">
   <div className="sectionBar"><div><span className="eyebrow">Apps</span><h2>Connect your stack</h2><p>Secure provider authorization. No API keys to copy or passwords shared with Handoff Hub.</p></div><span className="catalogBadge">4 integrations</span></div>
   <div className="appGrid">{apps.map(a=><article className="appCard" key={a.id}>
     <div className="appCardHead"><div className={"brandIcon brand-"+a.id}>{a.icon}</div><span className="category">{a.group}</span></div>
     <h3>{a.name}</h3><p>{a.desc}</p>
     <ConnectionButton provider={a.id as any} connected={connected.has(a.id)}/>
   </article>)}</div>
 </section>
}

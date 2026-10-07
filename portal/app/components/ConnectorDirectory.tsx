"use client";
import {useMemo,useState} from "react";
import ConnectionButton from "./ConnectionButton";
import "./directory.css";

// [id, name, category, description, live]
// live = the Hub can start a real sign-in for this app today (see MCP / CFG in src/provider-oauth.js).
// Non-live apps are listed honestly and cannot be clicked.
const APPS:ReadonlyArray<readonly [string,string,string,string,boolean]>=[
["github","GitHub","Developer","Repositories, issues and pull requests.",true],
["gitlab","GitLab","Developer","Source control and CI/CD pipelines.",true],
["vercel","Vercel","Developer","Projects, deployments and domains.",true],
["sentry","Sentry","Developer","Errors, releases and performance.",true],
["bitbucket","Bitbucket","Developer","Code hosting for teams.",false],
["notion","Notion","Productivity","Docs, wikis and team knowledge.",true],
["google-drive","Google Drive","Productivity","Files, documents and shared drives.",true],
["google-calendar","Google Calendar","Productivity","Calendars, events and scheduling.",true],
["sharepoint","SharePoint","Productivity","Microsoft team sites and files.",true],
["onenote","OneNote","Productivity","Notes and notebooks.",true],
["box","Box","Storage","Secure enterprise content.",true],
["dropbox","Dropbox","Storage","Cloud files and team storage.",true],
["slack","Slack","Communication","Team messages and channels.",true],
["microsoft-teams","Microsoft Teams","Communication","Team chat and meetings.",true],
["gmail","Gmail","Communication","Email and mailbox workflows.",true],
["discord","Discord","Communication","Community and team chat.",false],
["linear","Linear","Project Management","Product and engineering issues.",true],
["jira","Jira","Project Management","Issues, sprints and planning.",true],
["asana","Asana","Project Management","Tasks, projects and team plans.",true],
["clickup","ClickUp","Project Management","Tasks, docs and workflows.",false],
["monday","Monday.com","Project Management","Work management for teams.",false],
["hubspot","HubSpot","CRM & Support","Contacts, deals and marketing.",true],
["zendesk","Zendesk","CRM & Support","Tickets and customer support.",true],
["salesforce","Salesforce","CRM & Support","CRM records and pipelines.",false],
["intercom","Intercom","CRM & Support","Customer messaging.",false],
["supabase","Supabase","Data","Projects, databases and edge functions.",true],
["postgresql","PostgreSQL","Data","Direct database access.",false],
["snowflake","Snowflake","Data","Cloud data warehouse.",false],
["bigquery","BigQuery","Data","Analytics data warehouse.",false],
["google-analytics","Google Analytics","Data","Web and product analytics.",false],
["canva","Canva","Design","Designs and team assets.",true],
["figma","Figma","Design","Design files and components.",true],
["zapier","Zapier","Automation","Automations across apps.",false]
];
const initials=(n:string)=>n.split(/[\s.]+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();

export default function ConnectorDirectory({connected,names}:{connected:string[];names:Record<string,string>}){
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("All");
  const on=useMemo(()=>new Set(connected),[connected]);
  const cats=useMemo(()=>["All",...Array.from(new Set(APPS.map(a=>a[2])))],[]);
  const rows=APPS.filter(a=>(cat==="All"||a[2]===cat)&&(a[1]+" "+a[3]+" "+a[2]).toLowerCase().includes(q.trim().toLowerCase()));
  return <section className="cf">
    <nav className="cfRail" aria-label="Categories"><h4>Categories</h4>{cats.map(c=><button key={c} aria-pressed={cat===c} onClick={()=>setCat(c)}>{c}<span>{c==="All"?APPS.length:APPS.filter(a=>a[2]===c).length}</span></button>)}</nav>
    <div className="cfMain">
      <h1>Integrations</h1>
      <p>Connect your tools with their own sign-in. Handoff Hub never sees your passwords.</p>
      <input className="cfSearch" type="search" placeholder="Search integrations" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search integrations"/>
      <p className="cfMeta">{rows.length} of {APPS.length} integrations · {connected.length} connected</p>
      {rows.length===0?<div className="cfEmpty">No integrations match “{q}”.</div>:<div className="cfGrid">{rows.map(([id,name,group,desc,live])=><article className="cfCard" key={id}>
        <div className="cfHead"><div className="cfLogo">{initials(name)}</div><div><b>{name}</b><span>{group}</span></div></div>
        <p>{on.has(id)&&names[id]?"Connected as "+names[id]+".":desc}</p>
        <div className="cfFoot">{live?<ConnectionButton provider={id} connected={on.has(id)}/>:<span className="cfNote">Not available yet</span>}</div>
      </article>)}</div>}
    </div>
  </section>;
}

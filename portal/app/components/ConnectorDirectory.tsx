"use client";

import ConnectionButton from "./ConnectionButton";

const apps = [["github","GitHub","Developer","GH","Repositories, issues and development workflows.",true],["gitlab","GitLab","Developer","GL","Source control and CI/CD workflows.",false],["bitbucket","Bitbucket","Developer","BB","Code hosting and team development.",false],["jira","Jira","Project Management","J","Issues, sprints and engineering planning.",false],["linear","Linear","Project Management","L","Product and engineering issue tracking.",false],["notion","Notion","Productivity","N","Docs, wikis and team knowledge.",false],["google-drive","Google Drive","Productivity","GD","Files, documents and shared drives.",false],["dropbox","Dropbox","Storage","DB","Cloud files and team storage.",false],["box","Box","Storage","BX","Secure enterprise content and files.",false],["onedrive","OneDrive","Storage","OD","Microsoft cloud files and documents.",false],["google-calendar","Google Calendar","Productivity","GC","Calendars, events and scheduling.",false],["slack","Slack","Communication","S","Team messages and collaboration.",false],["microsoft-teams","Microsoft Teams","Communication","T","Team chat and collaboration.",false],["discord","Discord","Communication","D","Community and team communication.",false],["hubspot","HubSpot","CRM & Sales","H","CRM, contacts and sales workflows.",false],["salesforce","Salesforce","CRM & Sales","SF","CRM records and customer workflows.",false],["pipedrive","Pipedrive","CRM & Sales","P","Sales pipeline and deals.",false],["zendesk","Zendesk","Support","Z","Customer support and ticket workflows.",false],["intercom","Intercom","Support","I","Customer messaging and support.",false],["supabase","Supabase","Data","Sb","Projects, databases and edge functions.",true],["postgresql","PostgreSQL","Data","PG","PostgreSQL databases and data workflows.",false],["snowflake","Snowflake","Data","SF","Cloud data warehouse workflows.",false],["bigquery","BigQuery","Data","BQ","Analytics data warehouse workflows.",false],["google-analytics","Google Analytics","Analytics","GA","Web and product analytics.",false],["mixpanel","Mixpanel","Analytics","M","Product analytics and events.",false],["amplitude","Amplitude","Analytics","A","Product analytics and behavioral insights.",false],["mailchimp","Mailchimp","Marketing","MC","Email marketing and audiences.",false],["asana","Asana","Project Management","As","Tasks, projects and team planning.",false],["clickup","ClickUp","Project Management","C","Tasks, docs and project workflows.",false],["monday","Monday.com","Project Management","Mo","Work management and team planning.",false],["canva","Canva","Design","Ca","Design workflows and team assets.",true],["figma","Figma","Design","F","Design files and collaboration.",false],["zapier","Zapier","Automation","Zp","Automations and connected workflows.",false],["vercel","Vercel","Infrastructure","▲","Deployments, projects and infrastructure.",true]] as const;

export default function ConnectorDirectory({connected}:{connected:Set<string>}){
 return <section className="appsSection">
   <div className="sectionBar">
     <div>
       <span className="eyebrow">Integrations</span>
       <h2>Connect your stack</h2>
       <p>Browse a curated set of popular tools. Provider authorization is always explicit and per-account.</p>
     </div>
     <span className="catalogBadge">{apps.length} integrations</span>
   </div>
   <div className="appGrid">
     {apps.map(([id,name,group,icon,desc,available])=>
       <article className="appCard" key={id}>
         <div className="appCardHead">
           <div className={"brandIcon brand-"+id}>{icon}</div>
           <span className="category">{group}</span>
         </div>
         <h3>{name}</h3>
         <p>{desc}</p>
         <ConnectionButton provider={id} connected={connected.has(id)} available={available}/>
       </article>
     )}
   </div>
 </section>
}

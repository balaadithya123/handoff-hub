import {cookies} from "next/headers";
import {SESSION_COOKIE,sessionUser} from "../lib/portal";
import {connectionStatus} from "../lib/connections";
import Shell,{type Tab} from "./components/Shell";
import ConnectorDirectory from "./components/ConnectorDirectory";
import AiAccounts from "./components/AiAccounts";
import ActivityLog from "./components/ActivityLog";
import Overview from "./components/Overview";
import HubTools from "./components/HubTools";
import Projects from "./components/Projects";

export const dynamic="force-dynamic";

type Notice={kind:"error"|"ok";text:string}|null;

const META:Record<Tab,[string,string]>={
  overview:["Overview","Your Handoff Hub account at a glance."],
  integrations:["Integrations","Connect your tools with their own sign-in. Handoff Hub never sees your passwords."],
  projects:["Projects","Separate memory pools your AI apps can save to. Monitor each one and choose which feeds Overview and Activity."],
  ai:["AI accounts","Link the AI accounts that use your connections."],
  tools:["Hub tools","Allowlist, AI workload, claims, approvals, checks and the handoff brief."],
  activity:["Activity","What your AI accounts did through the Hub."]
};

function Landing(){
  return (
    <div className="site">
      <header className="top">
        <a className="brand" href="/">
          <span className="logo">H</span>
          <span>Handoff Hub</span>
        </a>
        <nav>
          <a href="/connect/setup">How it works</a>
          <a className="navButton" href="/login">Sign in</a>
        </nav>
      </header>
      <main className="wrap">
        <section className="landingHero">
          <div>
            <span className="eyebrow">Secure integrations</span>
            <h1>Your apps.<br/><span>One secure handoff.</span></h1>
            <p>Connect the tools you already use to power AI workflows. Authorize directly with each provider and keep credentials isolated to your account.</p>
            <div className="actions">
              <a className="primaryLink" href="/login">Get started</a>
              <a className="secondaryLink" href="/connect/setup">Learn how it works &rarr;</a>
            </div>
            <div className="trustRow">
              <span>✓ OAuth authorization</span>
              <span>✓ Account-isolated</span>
              <span>✓ Server-side tokens</span>
            </div>
          </div>
          <div className="heroVisual">
            <div className="visualTop">
              <span>HANDOFF HUB</span>
              <span className="live"><i/>LIVE</span>
            </div>
            <div className="flow">
              <div className="flowNode"><b>01</b><strong>Your account</strong><span>Choose an app</span></div>
              <div className="flowLine"/>
              <div className="flowNode active"><b>02</b><strong>Provider</strong><span>Approve access</span></div>
              <div className="flowLine"/>
              <div className="flowNode"><b>03</b><strong>Handoff</strong><span>Use securely</span></div>
            </div>
            <div className="visualFooter">No provider passwords are sent to Handoff Hub.</div>
          </div>
        </section>
        <section className="stats">
          <div><b>OAuth-first</b><span>Provider-hosted authorization</span></div>
          <div><b>Private by default</b><span>Each account has its own connections</span></div>
          <div><b>Built for AI</b><span>Ready for tool-enabled workflows</span></div>
        </section>
      </main>
      <footer className="foot">Handoff Hub &middot; Secure context handoff for AI workflows</footer>
    </div>
  );
}

async function Dashboard({email,token,tab,notice}:{email:string;token:string;tab:Tab;notice:Notice}){
  const connections=await connectionStatus(token).catch(()=>[]);
  const names:Record<string,string>={};
  for(const c of connections){if(c.provider_account_name)names[c.provider]=c.provider_account_name}
  const [title,sub]=META[tab];
  return (
    <Shell email={email} tab={tab} title={title} sub={sub} notice={notice}>
      {tab==="integrations"?<ConnectorDirectory connected={connections.map(c=>c.provider as string)} names={names}/>
      :tab==="projects"?<Projects token={token}/>
      :tab==="ai"?<AiAccounts token={token}/>
      :tab==="tools"?<HubTools token={token}/>
      :tab==="activity"?<section className="shPanel"><ActivityLog token={token} limit={30}/></section>
      :<Overview token={token} connected={connections.length}/>}
    </Shell>
  );
}

export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const jar=await cookies();
  const token=jar.get(SESSION_COOKIE)?.value;
  const user=await sessionUser(token);
  const sp=(await searchParams) || {};
  const err=typeof sp.connection_error==="string"?sp.connection_error:"";
  const ok=typeof sp.connected==="string"?sp.connected:"";
  const notice:Notice=err?{kind:"error",text:err}:ok?{kind:"ok",text:"Connected "+ok+"."}:null;
  const t=typeof sp.tab==="string"?sp.tab:"";
  const tab:Tab=t==="integrations"||t==="projects"||t==="ai"||t==="tools"||t==="activity"||t==="overview"?t:(notice?"integrations":"overview");

  return user && token ? (
    <Dashboard email={user.email} token={token} tab={tab} notice={notice}/>
  ) : (
    <Landing/>
  );
}

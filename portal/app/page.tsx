import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionUser } from "../lib/portal";
import { connectionStatus } from "../lib/connections";
import SignOutButton from "./components/SignOutButton";
import ConnectionButton from "./components/ConnectionButton";
import type { Provider } from "../lib/connections";

export const dynamic = "force-dynamic";

const apps: Array<{ id: Provider; name: string; tag: string; icon: string; description: string }> = [
  { id: "github", name: "GitHub", tag: "Development", icon: "GH", description: "Repositories, branches and commits." },
  { id: "canva", name: "Canva", tag: "Design", icon: "Ca", description: "Designs and your creative workspace." },
  { id: "vercel", name: "Vercel", tag: "Deployments", icon: "▲", description: "Projects, deployments and hosting." },
];

function Landing() {
  return (
    <div className="page">
      <header className="top"><a className="brand" href="/"><span className="logo">H</span><span>Handoff Hub</span></a><a className="navButton" href="/login">Sign in</a></header>
      <main className="wrap">
        <section className="landingHero">
          <div className="landingCopy">
            <span className="eyebrow">Handoff Hub</span>
            <h1>One place to <span>connect your tools.</span></h1>
            <p>Move between AI workflows without losing context. Sign in once, then manage supported integrations from one secure portal.</p>
            <div className="actions"><a className="primaryLink" href="/login">Get started</a><a className="secondaryLink" href="/login">Open portal</a></div>
          </div>
          <div className="landingPanel">
            <div className="panelHeader"><span>Integration portal</span><span className="statusDot">Ready</span></div>
            <div className="miniCard"><strong>GitHub</strong><span>Development</span></div>
            <div className="miniCard"><strong>Canva</strong><span>Design</span></div>
            <div className="miniCard"><strong>Vercel</strong><span>Deployments</span></div>
            <p>Provider authorization happens on each service's own page. No third-party passwords or API keys are requested here.</p>
          </div>
        </section>
        <section className="featureRow">
          <article><b>Secure sign-in</b><span>Email + password with a private session.</span></article>
          <article><b>One dashboard</b><span>Manage supported connections from one place.</span></article>
          <article><b>Real authorization</b><span>Connect through the provider's official flow.</span></article>
        </section>
      </main>
      <footer className="foot"><span>Handoff Hub</span><span>Secure context handoff for AI workflows</span></footer>
    </div>
  );
}

async function Dashboard({ email, sessionToken }: { email: string; sessionToken: string }) {
  const connections = await connectionStatus(sessionToken);
  const connected = new Map(connections.map((c) => [c.provider, c]));
  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/"><span className="logo">H</span><span>Handoff Hub</span></a>
        <div className="userChip"><span className="avatar">{email[0].toUpperCase()}</span><span className="userEmail">{email}</span><SignOutButton /></div>
      </header>
      <main className="wrap">
        <section className="dash">
          <span className="eyebrow">Signed in</span>
          <h1>Connect your apps</h1>
          <p className="lead">Authorize each service once. Handoff Hub stores the connection securely and can use it for future AI tool calls.</p>
          <div className="grid">{apps.map(a => {
            const c = connected.get(a.id);
            return <article className={"card" + (c ? "" : " dim")} key={a.id}>
              <div className="cardTop"><div className="appIcon">{a.icon}</div><span className={"pill " + (c ? "connectedPill" : "soon")}>{c ? "Connected" : "Ready to connect"}</span></div>
              <div className="tag">{a.tag}</div><h3>{a.name}</h3>
              <p>{c?.provider_account_name ? `Connected as ${c.provider_account_name}.` : a.description}</p>
              <ConnectionButton provider={a.id} connected={!!c} />
            </article>;
          })}</div>
        </section>
      </main>
      <footer className="foot"><span className="shield">✓</span>OAuth tokens stay server-side and encrypted. Provider passwords never reach Handoff Hub.</footer>
    </div>
  );
}

export default async function Home() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token);
  return user && token ? <Dashboard email={user.email} sessionToken={token} /> : <Landing />;
}

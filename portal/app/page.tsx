import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../lib/portal";
import SignOutButton from "./components/SignOutButton";

export const dynamic = "force-dynamic";

const apps = [
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

function Dashboard({ email }: { email: string }) {
  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/"><span className="logo">H</span><span>Handoff Hub</span></a>
        <div className="userChip"><span className="avatar">{email[0].toUpperCase()}</span><span className="userEmail">{email}</span><SignOutButton /></div>
      </header>
      <main className="wrap">
        <section className="dash"><span className="eyebrow">Signed in</span><h1>Connect your apps</h1><p className="lead">App connections are being enabled one at a time. None are connected yet.</p>
          <div className="grid">{apps.map(a => <article className="card dim" key={a.id}><div className="cardTop"><div className="appIcon">{a.icon}</div><span className="pill soon">Coming soon</span></div><div className="tag">{a.tag}</div><h3>{a.name}</h3><p>{a.description}</p><button className="connect" disabled>Coming soon</button></article>)}</div>
        </section>
      </main>
      <footer className="foot"><span className="shield">✓</span>Access is granted on each service's own authorization page. Your third-party passwords stay with their provider.</footer>
    </div>
  );
}

export default async function Home() {
  const jar = await cookies();
  const user = await sessionUser(jar.get(SESSION_COOKIE)?.value);
  return user ? <Dashboard email={user.email} /> : <Landing />;
}

"use client";

import { useState } from "react";

const apps = [
  { id: "github", name: "GitHub", icon: "GH", description: "Repositories, commits and development workflows.", available: true },
  { id: "canva", name: "Canva", icon: "C", description: "Designs and creative workspace access.", available: true },
  { id: "vercel", name: "Vercel", icon: "▲", description: "Projects, deployments and hosting.", available: true },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  async function login() {
    if (!email) return;
    setSent(true);
    // Authentication/OAuth endpoints are wired through the Hub environment in production.
  }

  function connect(id: string) {
    const base = process.env.NEXT_PUBLIC_HUB_URL;
    const url = base ? `${base.replace(/\/$/, "")}/oauth/${id}/authorize?return_to=${encodeURIComponent(window.location.origin)}` : "";
    if (url) window.location.href = url;
    else setConnected((x) => ({ ...x, [id]: true }));
  }

  return (
    <main>
      <header className="top"><div className="brand"><span className="mark">H</span><span>Handoff</span></div><span className="pill">Integration Portal</span></header>
      <section className="hero">
        <div className="eyebrow">ONE ACCOUNT · ALL YOUR TOOLS</div>
        <h1>Connect your apps<br/><em>in one place.</em></h1>
        <p>Sign in once, then securely connect the services you use with Handoff Hub. No API keys to copy around.</p>
        <div className="login">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" />
          <button onClick={login}>{sent ? "Check your email" : "Continue with email →"}</button>
        </div>
        {sent && <div className="notice">A sign-in link will be sent to your email when authentication is enabled for this portal.</div>}
      </section>
      <section className="apps">
        <div className="sectionHead"><div><span className="eyebrow">AVAILABLE CONNECTIONS</span><h2>Your integrations</h2></div><span className="count">{apps.length} apps</span></div>
        <div className="grid">
          {apps.map(app => <article className="card" key={app.id}>
            <div className="appIcon">{app.icon}</div>
            <div className="cardBody"><h3>{app.name}</h3><p>{app.description}</p></div>
            <button className={connected[app.id] ? "connected" : ""} onClick={()=>connect(app.id)}>{connected[app.id] ? "✓ Connected" : "Connect"}</button>
          </article>)}
          <article className="card add"><div className="plus">+</div><div className="cardBody"><h3>More integrations</h3><p>New connectors can be added without changing your account.</p></div></article>
        </div>
      </section>
      <footer><span>Handoff Hub</span><span>Secure OAuth connections · Tokens stay server-side</span></footer>
    </main>
  );
}

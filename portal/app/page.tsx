"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { email: string };
type Mode = "login" | "signup";
type Notice = { kind: "error" | "ok"; text: string } | null;
type App = {
  id: string;
  name: string;
  tag: string;
  icon: string;
  description: string;
  enabled: boolean;
};

const apps: App[] = [
  { id: "github", name: "GitHub", tag: "Development", icon: "GH", description: "Repositories, branches and commits.", enabled: false },
  { id: "canva", name: "Canva", tag: "Design", icon: "Ca", description: "Designs and your creative workspace.", enabled: true },
  { id: "vercel", name: "Vercel", tag: "Deployments", icon: "▲", description: "Projects, deployments and hosting.", enabled: false },
];

const points = [
  "Sign in once, connect every tool you use",
  "Authorize on each provider's own page",
  "We never ask for passwords or API keys",
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.user) setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const addr = email.trim().toLowerCase();
    if (!addr || !password) {
      setNotice({ kind: "error", text: "Enter your email and password." });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email: addr, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNotice({ kind: "error", text: d.error || "Could not sign in." });
        return;
      }
      setUser(d.user);
      setPassword("");
    } catch {
      setNotice({ kind: "error", text: "Could not reach the account service." });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/account", { method: "DELETE" }).catch(() => {});
    setUser(null);
    setNotice(null);
  }

  async function connect(app: App) {
    setNotice(null);
    if (!user || !app.enabled) return;
    if (app.id === "canva") {
      setBusy(true);
      try {
        const r = await fetch("/api/canva/oauth/start", { credentials: "include" });
        const p = await r.json().catch(() => ({}));
        if (!r.ok || !p.authorization_url) {
          setNotice({ kind: "error", text: p.error || "Canva connection is not configured." });
          return;
        }
        window.location.href = p.authorization_url;
      } catch {
        setNotice({ kind: "error", text: "Could not start the Canva connection." });
      } finally {
        setBusy(false);
      }
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    setNotice(null);
  };

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="/">
          <span className="logo">H</span>
          <span>Handoff Hub</span>
        </a>
        {user ? (
          <div className="userChip">
            <span className="avatar">{(user.email || "U")[0].toUpperCase()}</span>
            <span className="userEmail">{user.email}</span>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>
        ) : null}
      </header>

      <main className="wrap">
        {checking ? (
          <div className="loading">Loading…</div>
        ) : !user ? (
          <section className="hero">
            <div className="heroText">
              <span className="eyebrow">Integration portal</span>
              <h1>
                One account.<br />
                <span>Every connection.</span>
              </h1>
              <p>Link your development, design and deployment tools to Handoff Hub in a few clicks.</p>
              <ul className="points">
                {points.map((p) => (
                  <li key={p}><span className="tick">✓</span>{p}</li>
                ))}
              </ul>
            </div>

            <form className="authCard" onSubmit={submit} noValidate>
              <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="sub">
                {mode === "login" ? "Sign in with your email and password." : "Use an email and a password to get started."}
              </p>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </label>

              <label>
                Password
                <div className="pw">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="button" className="eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {notice && <div className={"notice " + notice.kind} role="alert">{notice.text}</div>}

              <button className="primary" type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>

              <p className="swap">
                {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </form>
          </section>
        ) : (
          <section className="dash">
            <span className="eyebrow">Signed in</span>
            <h1>Connect your apps</h1>
            <p className="lead">Pick a service to start its official authorization flow.</p>
            {notice && <div className={"notice wide " + notice.kind} role="alert">{notice.text}</div>}

            <div className="grid">
              {apps.map((a) => (
                <article className={"card" + (a.enabled ? "" : " dim")} key={a.id}>
                  <div className="cardTop">
                    <div className="appIcon">{a.icon}</div>
                    <span className={a.enabled ? "pill ready" : "pill soon"}>
                      {a.enabled ? "Available" : "Coming soon"}
                    </span>
                  </div>
                  <div className="tag">{a.tag}</div>
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                  <button className="connect" disabled={!a.enabled || busy} onClick={() => connect(a)}>
                    {a.enabled ? (busy ? "Opening…" : "Connect " + a.name) : "Coming soon"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <span className="shield">✓</span>
        Access is granted on each service's own authorization page. Your third-party passwords stay with their provider.
      </footer>
    </div>
  );
}

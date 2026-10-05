"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const apps = [
  { id: "github", name: "GitHub", icon: "GH", description: "Repositories and development access.", status: "available" },
  { id: "canva", name: "Canva", icon: "C", description: "Designs and creative workspace access.", status: "available" },
  { id: "vercel", name: "Vercel", icon: "▲", description: "Projects, deployments and hosting.", status: "available" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function auth() {
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setMessage("Enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email: normalizedEmail, password })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Email confirmation is enabled on the authentication server; sign in after confirming it.");
      return;
    }

    setUser(result.data.user);
    setMessage(mode === "signup" ? "Account created and signed in." : "Signed in.");
  }

  async function connect(app: (typeof apps)[number]) {
    setMessage("");
    if (!user) {
      setMessage("Sign in first.");
      return;
    }

    if (app.id === "canva") {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessage("Your session expired. Sign in again.");
        return;
      }
      setBusy(true);
      try {
        const response = await fetch("/api/canva/oauth/start", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.authorization_url) {
          setMessage(payload.error || "Canva connection is not configured on the server yet.");
          return;
        }
        window.location.href = payload.authorization_url;
      } catch {
        setMessage("Could not start the Canva connection.");
      } finally {
        setBusy(false);
      }
      return;
    }

    setMessage(`${app.name} account connection is not enabled on this server yet. The button is intentionally kept from pretending it connected.`);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setMessage("Signed out.");
  }

  return (
    <main className="portal">
      <header className="top">
        <a className="brand" href="/">
          <span className="mark">H</span>
          <span>Handoff</span>
        </a>
        <span className="pill">Account &amp; Connections</span>
      </header>

      <section className="hero">
        <div className="eyebrow">HANDOFF HUB</div>
        <h1>One login.<br /><em>Your connected apps.</em></h1>
        <p className="lead">
          Sign in here, then connect services from their official authorization pages.
          Your app credentials never belong in this form.
        </p>

        {!user ? (
          <div className="authCard">
            <div className="tabs" role="tablist">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>
                Sign in
              </button>
              <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>
                Create account
              </button>
            </div>
            <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 6 characters" /></label>
            <button className="primary" type="button" disabled={busy} onClick={auth}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>
        ) : (
          <div className="accountBar">
            <div><span className="dot" /> Signed in as <strong>{user.email}</strong></div>
            <button type="button" onClick={logout}>Sign out</button>
          </div>
        )}

        {message && <div className="notice" aria-live="polite">{message}</div>}
      </section>

      <section className="connections">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">CONNECTIONS</div>
            <h2>Connect your services</h2>
          </div>
          <span className="count">{apps.length} services</span>
        </div>

        <div className="grid">
          {apps.map((app) => (
            <article className="card" key={app.id}>
              <div className="appTop">
                <div className="appIcon">{app.icon}</div>
                <span className="state">{app.id === "canva" ? "OAuth" : "Ready for setup"}</span>
              </div>
              <h3>{app.name}</h3>
              <p>{app.description}</p>
              <button
                className="connect"
                type="button"
                disabled={!user || busy}
                onClick={() => connect(app)}
              >
                {!user ? "Sign in first" : busy ? "Working…" : "Connect"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span>Handoff Hub</span>
        <span>Authentication stays with the account provider · App tokens stay server-side</span>
      </footer>
    </main>
  );
}

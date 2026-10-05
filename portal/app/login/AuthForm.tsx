"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email: email.trim(), password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "Could not sign in.");
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  function swap() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
  }

  return (
    <form className="authCard" onSubmit={submit} noValidate>
      <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
      <p className="sub">
        {mode === "login" ? "Sign in with your email and password." : "Choose an email and a password of 8+ characters."}
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
            placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button type="button" className="eye" onClick={() => setShowPw(!showPw)}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {error && <div className="notice error" role="alert">{error}</div>}

      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="swap">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" onClick={swap}>{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </form>
  );
}

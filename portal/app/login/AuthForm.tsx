"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

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
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const nextPath = params?.get("next") || "/overview";
      router.replace(nextPath);
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
    <Card className="p-6 space-y-4 shadow-2xl">
      <div>
        <h2 className="text-xl font-bold text-[#ededed]">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p className="text-xs text-[#a1a1a1] mt-1">
          {mode === "login"
            ? "Sign in with your email and password."
            : "Choose an email and a password of 8+ characters."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a1a1a1] block">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a1a1a1] block">Password</label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-2 text-[11px] font-mono text-[#8a8a8a] hover:text-[#ededed] px-1.5 py-0.5 rounded bg-white/5"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-[#ff7b7b]/30 bg-[#ff7b7b]/10 text-xs text-[#ff7b7b]">
            {error}
          </div>
        )}

        <Button variant="primary" type="submit" loading={busy} className="w-full">
          {mode === "login" ? "Sign In" : "Create Account"}
        </Button>

        <div className="text-center pt-2 text-xs text-[#8a8a8a]">
          {mode === "login" ? "New to Handoff Hub?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={swap}
            className="text-[#3ecf8e] font-semibold hover:underline bg-transparent border-0 p-0"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </form>
    </Card>
  );
}

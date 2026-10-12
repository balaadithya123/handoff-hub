"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";

type Mode = "login" | "signup";

const inputWrap =
  "flex items-center gap-3 h-[54px] px-4 rounded-xl bg-[#141414] border border-white/[0.06] focus-within:border-[#3ecf8e]/50 transition-colors";
const inputEl = "flex-1 bg-transparent outline-none text-[15px] text-[#ededed] placeholder:text-[#4a4a4a] min-w-0";

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

  const login = mode === "login";

  return (
    <div className="w-full max-w-[530px]">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0e0e0e]/95 px-7 py-9 sm:px-12 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Logo size={60} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3ecf8e] ring-4 ring-[#0e0e0e]" />
          </div>
          <h1 className="mt-6 text-[26px] leading-8 font-semibold tracking-[-0.03em] text-[#ededed]">
            {login ? "Sign in to Handoff Hub" : "Create your Handoff Hub account"}
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-[#a1a1a1] max-w-[360px]">
            Access your shared context mesh and connected AI tools
          </p>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="GitHub sign-in is coming soon"
          className="mt-8 w-full h-[54px] rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center gap-3 text-[15px] font-medium text-[#ededed] opacity-70 cursor-not-allowed"
        >
          <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Continue with GitHub</span>
          <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[10px] text-[#707070]">Soon</span>
        </button>

        <div className="flex items-center gap-4 my-6">
          <span className="flex-1 h-px bg-white/[0.08]" />
          <span className="font-mono text-[12px] tracking-wider text-[#707070] uppercase">Or continue with email</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-email" className="text-[15px] font-medium text-[#ededed]">
                Work Email
              </label>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#3ecf8e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                Secure channel
              </span>
            </div>
            <div className={inputWrap}>
              <span className="text-[#707070] text-[18px] leading-none" aria-hidden>@</span>
              <input
                id="auth-email"
                type="email"
                className={inputEl}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="text-[15px] font-medium text-[#ededed] block">
              Password
            </label>
            <div className={inputWrap}>
              <Lock className="w-[18px] h-[18px] text-[#707070] shrink-0" aria-hidden />
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                className={inputEl}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={login ? "Your password" : "At least 8 characters"}
                autoComplete={login ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                className="font-mono text-[11px] text-[#8a8a8a] hover:text-[#ededed] px-1.5 py-0.5 rounded bg-white/5"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl border border-[#ff7b7b]/30 bg-[#ff7b7b]/10 text-[13px] text-[#ff7b7b]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-[54px] rounded-xl bg-white text-black text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-neutral-200 disabled:opacity-60 transition-colors"
          >
            {busy ? "Please wait…" : login ? "Sign in" : "Create account"}
            {!busy && <ArrowRight className="w-[18px] h-[18px]" />}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between rounded-lg bg-[#141414] border border-white/[0.04] px-4 py-3.5 font-mono text-[12px] text-[#707070]">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3ecf8e]" aria-hidden />
            Encrypted in transit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ddcc6]" />
            Account isolated
          </span>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[12px] text-[#a1a1a1]">
        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#3ecf8e] shrink-0" aria-hidden />OAuth 2.0 PKCE direct auth</span>
        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#3ecf8e] shrink-0" aria-hidden />No third-party passwords</span>
        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#3ecf8e] shrink-0" aria-hidden />Account-isolated memory</span>
      </div>

      <p className="mt-8 text-center text-[15px] text-[#a1a1a1]">
        {login ? "Don't have an account?" : "Already have an account?"}{" "}
        <button type="button" onClick={swap} className="text-[#ededed] font-semibold border-b border-white/40 hover:border-white bg-transparent p-0">
          {login ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

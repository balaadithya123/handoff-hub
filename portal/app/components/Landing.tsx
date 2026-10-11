import Link from "next/link";
import { ArrowRight, Brain, Lock, Plug, ShieldCheck } from "lucide-react";
import PublicHeader from "./PublicHeader";
import Spot from "./landing/Spot";
import CountUp from "./landing/CountUp";
import HeroTrace from "./landing/HeroTrace";
import LiveConsole from "./landing/LiveConsole";
import "./landing/landing.css";

const APPS = ["GitHub", "Vercel", "Supabase", "Notion", "Canva", "Slack", "Linear", "Figma", "Google Drive", "Gmail", "Sentry", "Jira"];

const FEATURES = [
  {
    icon: Brain,
    label: "Cross-AI memory",
    title: "One memory for every assistant",
    body: "Claude, ChatGPT and your coding agents read and write the same private project memory, so nothing gets re-explained.",
  },
  {
    icon: Plug,
    label: "Connected tools",
    title: "Your stack, one authorization",
    body: "Connect GitHub, Vercel, Supabase and more through each provider's own sign-in page. Your AIs use them through the Hub.",
  },
  {
    icon: ShieldCheck,
    label: "Account isolation",
    title: "Scoped to your account",
    body: "Tokens and memory stay isolated per account. The Hub never asks for third-party passwords or API keys.",
  },
];

const BARS = [10, 14, 20, 16, 24, 28];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans antialiased flex flex-col">
      <PublicHeader />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-14 sm:space-y-20">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/[0.08] font-mono text-[10px] text-[#a1a1a1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
              PORTAL // CONTEXT-HANDOFF
            </div>

            <h1 className="text-[32px] sm:text-[48px] leading-[36px] sm:leading-[52px] font-semibold tracking-[-0.03em] sm:tracking-[-0.04em] text-[#ededed]">
              One context.
              <br />
              <span className="text-[#3ecf8e]">Every AI you use.</span>
            </h1>

            <p className="text-[16px] leading-[26px] tracking-[-0.01em] text-[#a1a1a1] max-w-xl">
              Your work should move with you. Save decisions once, hand tasks between assistants, and continue without repeating context. Connect tools through their own secure sign-in, with access isolated to your account.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/login"
                className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3ecf8e] hover:bg-[#51df9c] text-[#002112] text-[13px] font-semibold"
              >
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/connect/setup"
                className="btn-press inline-flex items-center px-4 py-2.5 rounded-lg bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[#ededed] text-[13px] font-medium"
              >
                How it works
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-white/[0.08] font-mono text-[11px] text-[#707070]">
              <span>OAuth 2.0 + PKCE</span>
              <span>Account-isolated tokens</span>
              <span>No third-party passwords</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroTrace />
          </div>
        </section>

        {/* KPI bento */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Hub facts">
          <Spot className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">Hub tools</span>
              <Plug className="w-4 h-4 text-[#707070]" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[20px] leading-[26px] font-semibold tracking-[-0.025em] tabular-nums">
                  <CountUp to={45} />
                </div>
                <div className="font-mono text-[11px] text-[#3ecf8e] mt-0.5">memory, handoff, claims, apps</div>
              </div>
              <div className="flex items-end gap-1 h-7" aria-hidden>
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    className={`bar-grow w-1 rounded-[1px] ${i < 2 ? "bg-[#2a2a2a]" : "bg-[#3ecf8e]"}`}
                    style={{ height: h, opacity: i < 2 ? 1 : 0.4 + (i - 2) * 0.2, animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </div>
            </div>
          </Spot>

          <Spot className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">Account isolation</span>
              <ShieldCheck className="w-4 h-4 text-[#707070]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[20px] leading-[26px] font-semibold tracking-[-0.025em]">Per account</div>
                <div className="font-mono text-[11px] text-[#3ecf8e] bg-[#3ecf8e]/10 px-1.5 py-0.5 rounded border border-[#3ecf8e]/20 inline-block mt-1">
                  tokens + memory
                </div>
              </div>
              <svg className="w-8 h-8 -rotate-90 text-[#3ecf8e]" viewBox="0 0 36 36" aria-hidden>
                <path
                  className="text-[#2a2a2a]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="3"
                />
                <path
                  className="ring-draw"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="100, 100"
                />
              </svg>
            </div>
          </Spot>

          <Spot className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">Passwords stored</span>
              <Lock className="w-4 h-4 text-[#707070]" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[20px] leading-[26px] font-semibold tracking-[-0.025em] tabular-nums">
                  <CountUp to={0} />
                </div>
                <div className="font-mono text-[11px] text-[#707070] mt-0.5">providers use their own sign-in</div>
              </div>
              <svg className="w-16 h-6 text-[#3ecf8e] overflow-visible" viewBox="0 0 64 24" fill="none" aria-hidden>
                <path d="M0 18 H64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4" />
                <circle cx="64" cy="18" r="2" fill="currentColor" />
              </svg>
            </div>
          </Spot>

          <Spot className="p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">AI apps linked</span>
              <span className="w-2 h-2 rounded-full bg-[#f5b14a] animate-pulse" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[20px] leading-[26px] font-semibold tracking-[-0.025em]">
                  Claude <span className="text-[#707070] font-normal">+</span> ChatGPT
                </div>
                <div className="font-mono text-[11px] text-[#707070] mt-0.5">one shared account</div>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#2a2a2a] text-[#4ddcc6] border border-white/[0.08]">
                Synced
              </span>
            </div>
          </Spot>
        </section>

        {/* Live console */}
        <section className="space-y-5" aria-labelledby="console-title">
          <div className="space-y-1.5">
            <h2 id="console-title" className="text-[24px] sm:text-[30px] leading-[30px] sm:leading-9 font-semibold tracking-[-0.03em]">
              See every handoff as it happens
            </h2>
            <p className="text-[13px] leading-[18px] text-[#a1a1a1] max-w-2xl">
              Each save, claim and task handoff shows up in your activity log with its trace and payload. Pick a row to inspect it.
            </p>
          </div>
          <LiveConsole />
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Spot key={f.label} rim className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">{f.label}</span>
                <f.icon className="w-4 h-4 text-[#3ecf8e]" />
              </div>
              <div>
                <h3 className="text-[16px] leading-[22px] font-semibold text-[#ededed] tracking-[-0.015em]">{f.title}</h3>
                <p className="text-[13px] text-[#a1a1a1] leading-[19px] mt-1.5">{f.body}</p>
              </div>
            </Spot>
          ))}
        </section>

        {/* Integrations */}
        <section className="space-y-4">
          <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">Works with</span>
          <div className="flex flex-wrap gap-2">
            {APPS.map((a) => (
              <span
                key={a}
                className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] hover:text-[#ededed] text-[13px] text-[#a1a1a1] transition-colors cursor-default"
              >
                {a}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 sm:px-8 py-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-[#707070]">
        <span>Handoff Hub &middot; Secure context handoff for AI workflows</span>
        <span className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-[#ededed] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#ededed] transition-colors">Privacy</Link>
          <Link href="/support" className="hover:text-[#ededed] transition-colors">Support</Link>
        </span>
      </footer>
    </div>
  );
}

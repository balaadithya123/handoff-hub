"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Plug, ShieldCheck, Terminal, Check } from "lucide-react";
import PublicHeader from "./PublicHeader";

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
    body: "Connect GitHub, Vercel, Supabase and more through each provider's own OAuth page. Your AIs use them through the Hub.",
  },
  {
    icon: ShieldCheck,
    label: "Account isolation",
    title: "Scoped to your account",
    body: "Tokens and memory stay isolated per account. The Hub never asks for third-party passwords or API keys.",
  },
];

const TRACE_STEPS = [
  { title: "Decision saved to project memory", agent: "claude", payload: '{\n  "action": "save_memory",\n  "agent": "claude",\n  "key": "arch_decision",\n  "project": "my-project"\n}' },
  { title: "Task handed to the next assistant", agent: "claude -> chatgpt", payload: '{\n  "action": "hand_off_task",\n  "agent": "claude",\n  "to": "chatgpt",\n  "project": "my-project"\n}' },
  { title: "Context brief picked up on the other side", agent: "chatgpt", payload: '{\n  "action": "get_context_brief",\n  "agent": "chatgpt",\n  "status": "ready",\n  "project": "my-project"\n}' },
];

export default function Landing({ signedIn = false }: { signedIn?: boolean }) {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % TRACE_STEPS.length) + 1);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const currentTrace = TRACE_STEPS[activeStep - 1];

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans antialiased flex flex-col">
      <PublicHeader signedIn={signedIn} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-16">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0a0a0a] border border-white/[0.08] font-mono text-[11px] text-[#bbcabe]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60eca8] animate-pulse" />
              <span>PORTAL // CONTEXT-HANDOFF</span>
            </div>

            <h1 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.04em] text-[#ededed]">
              Context that follows
              <br />
              <span className="text-[#60eca8]">every AI you use.</span>
            </h1>

            <p className="text-[15px] leading-relaxed text-[#a1a1a1] max-w-xl">
              Save decisions once, pass tasks between assistants, and pick up exactly where the last session stopped.
              Connect your tools with their own sign-in and keep everything scoped to your account.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={signedIn ? "/overview" : "/login"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#60eca8] hover:bg-[#7af0b6] text-[#00210f] text-[13px] font-semibold transition-colors"
              >
                {signedIn ? "Open dashboard" : "Get started"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/connect/setup"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#121212] hover:bg-[#201f1f] border border-white/[0.08] hover:border-white/[0.16] text-[#e5e2e1] text-[13px] font-medium transition-all"
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

          {/* Animated Hero Event Inspector / Codebox */}
          <div className="lg:col-span-5 rounded-xl bg-[#0a0a0a] border border-white/[0.08] hover:border-[#60eca8]/40 transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_-5px_rgba(96,236,168,0.15)] overflow-hidden group">
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-[#121212]/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#60eca8] animate-ping" />
                <span className="font-mono text-[12px] text-[#60eca8] font-medium">Event // Task handed off</span>
              </div>
              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/5 text-[#a1a1a1] border border-white/[0.08]">
                LIVE STREAM
              </span>
            </div>

            {/* From / To section */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.08] border-b border-white/[0.08] bg-[#0a0a0a]">
              <div className="p-3 space-y-0.5">
                <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">From</span>
                <span className="block text-[13px] font-medium text-[#ededed]">Claude 3.7 Sonnet</span>
              </div>
              <div className="p-3 space-y-0.5">
                <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">To</span>
                <span className="block text-[13px] font-medium text-[#ededed]">ChatGPT o3-mini</span>
              </div>
            </div>

            {/* Interactive Trace Steps */}
            <div className="p-3 border-b border-white/[0.08] space-y-2 bg-[#0a0a0a]">
              <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider mb-2">
                Pipeline Trace (Cycle {activeStep}/3)
              </span>
              {TRACE_STEPS.map((step, idx) => {
                const isActive = idx + 1 === activeStep;
                return (
                  <button
                    key={step.title}
                    onClick={() => setActiveStep(idx + 1)}
                    className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-[#121212] border border-[#60eca8]/30 text-[#ededed]"
                        : "bg-transparent border border-transparent text-[#707070] hover:text-[#a1a1a1]"
                    }`}
                  >
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isActive ? "bg-[#60eca8] shadow-[0_0_8px_#60eca8]" : "bg-[#2a2a2a]"
                      }`}
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium truncate">
                        <span className="font-mono text-[10px] text-[#707070] mr-2">0{idx + 1}</span>
                        {step.title}
                      </span>
                      {isActive && (
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#60eca8]/10 text-[#60eca8] border border-[#60eca8]/20 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Animated Code Payload Box */}
            <div className="p-3 relative bg-black/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-[#707070] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[#60eca8]" />
                  Payload Stream
                </span>
                <span className="font-mono text-[10px] text-[#707070]">JSON // S256</span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#000000]">
                {/* Subtle top scanline accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#60eca8] to-transparent opacity-60 animate-pulse" />
                <pre className="font-mono text-[11px] leading-relaxed text-[#60eca8] p-3 overflow-x-auto min-h-[120px] transition-all duration-300">
                  {currentTrace.payload}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Feature bento */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="p-5 rounded-xl bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">{f.label}</span>
                <f.icon className="w-4 h-4 text-[#60eca8]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#ededed] tracking-tight">{f.title}</h3>
                <p className="text-[13px] text-[#a1a1a1] leading-relaxed mt-1.5">{f.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Integrations */}
        <section className="space-y-4">
          <span className="font-mono text-[11px] text-[#707070] uppercase tracking-wider">Works with</span>
          <div className="flex flex-wrap gap-2">
            {APPS.map((a) => (
              <span
                key={a}
                className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] text-[13px] text-[#bbcabe] transition-colors cursor-default"
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

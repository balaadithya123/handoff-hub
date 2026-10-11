"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Key,
  Shield,
  Terminal,
  Check,
  Copy,
  ArrowLeftRight,
  Lock,
  Zap,
  CheckCircle2,
  Network,
  Plus,
  Unlock,
  Brain,
  Cpu,
} from "lucide-react";

export default function Landing() {
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleCopyCli = () => {
    navigator.clipboard.writeText("npx @handoff/cli init");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const faqs = [
    {
      q: "How does it connect to AI tools without passwords?",
      a: "Handoff Hub utilizes standard OAuth 2.0 PKCE and ephemeral scoped tokens. When connecting GitHub, Supabase, or Claude, authorization occurs on the provider's verified login page. Handoff Hub never intercepts or stores raw passwords or master credentials.",
    },
    {
      q: "Does proprietary code get stored for model training?",
      a: "Never. Handoff Hub acts purely as an encrypted transit mesh. Context shards and AST diffs are encrypted client-side with tenant-specific keys. Zero customer data is retained for training, and tokens are discarded as soon as handoffs conclude.",
    },
    {
      q: "What happens when two assistants edit the same file?",
      a: "The optimistic file-lock system alerts the second assistant that an active lock lease exists on the file (with remaining TTL). The incoming agent can either queue its patch or merge against the published AST brief once the first agent finishes.",
    },
    {
      q: "Can I run Handoff Hub entirely on-premises?",
      a: "Yes. Enterprise tiers include self-hosted docker configurations and Kubernetes Helm charts that connect directly to your own Redis / Postgres clusters with customer-managed AWS KMS keys.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-main font-sans antialiased selection:bg-primary/20 selection:text-primary flex flex-col">
      {/* TOP NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-canvas/80 border-b border-border-hairline transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2.5 group" href="/">
              <div className="relative w-8 h-8 rounded-lg bg-surface border border-border-hairline flex items-center justify-center overflow-hidden shadow-inner group-hover:border-primary/50 transition-colors">
                <div className="absolute inset-0 bg-primary/10 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="font-mono font-bold text-sm text-primary tracking-tight z-10">H</span>
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-text-main group-hover:text-white transition-colors">
                Handoff Hub
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-container border border-border-hairline text-text-soft tracking-wider ml-0.5">
                MESH 2.0
              </span>
            </Link>

            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface border border-border-hairline text-[11px] font-mono text-text-muted">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span>System Operational &mdash; v2.4</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-text-muted">
            <a className="hover:text-text-main transition-colors" href="#how-it-works">
              How it works
            </a>
            <a className="hover:text-text-main transition-colors" href="#core-engine">
              Core Engine
            </a>
            <a className="hover:text-text-main transition-colors" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-border-hairline text-[12px] font-mono text-text-muted hover:text-text-main hover:border-border-medium transition-all cursor-pointer"
              title="Search documentation"
              type="button"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-text-soft">Search docs...</span>
              <kbd className="px-1 py-0.5 rounded bg-surface-container border border-border-hairline text-[10px] text-text-soft">
                ⌘K
              </kbd>
            </button>
            <Link className="text-[13px] font-medium text-text-muted hover:text-text-main transition-colors px-2 py-1" href="/login">
              Sign in
            </Link>
            <Link
              style={{ color: "#000000" }}
              className="relative group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-neutral-200 shadow-[0_0_20px_rgba(62,207,142,0.2)] transition-all"
              href="/login"
            >
              <span>Start for free</span>
              <ArrowRight className="w-3.5 h-3.5 text-black stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN WRAPPER */}
      <main className="w-full pt-16 flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 overflow-hidden grid-bg radial-mask">
          {/* Ambient drifting aura glow */}
          <div className="pointer-events-none absolute -top-40 left-1/2 w-[850px] h-[480px] bg-primary/15 blur-[140px] rounded-full animate-aura-drift" />
          <div className="pointer-events-none absolute top-48 left-1/3 w-[360px] h-[360px] bg-secondary/10 blur-[130px] rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
              {/* Micro-badge pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-hairline text-[12px] font-mono shadow-inner">
                <span className="text-primary text-[11px]">✨</span>
                <span className="text-text-main uppercase font-semibold tracking-wider">PORTAL // CONTEXT MESH 2.0</span>
                <span className="text-text-soft">•</span>
                <span className="text-primary flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>SOC2 TYPE II COMPLIANT</span>
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.08]">
                Context that follows <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-main via-white to-primary">
                  every AI you use.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted max-w-2xl font-normal leading-relaxed text-balance">
                Save decisions once, pass file locks and project state seamlessly between Claude, ChatGPT, Cursor, and developer tools. Zero third-party passwords stored. Scoped to your private account vault.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  style={{ color: "#000000" }}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all active:scale-[0.98]"
                  href="/login"
                >
                  <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Get started with GitHub</span>
                </Link>

                <button
                  onClick={handleCopyCli}
                  className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface border border-border-hairline hover:border-border-medium font-mono text-[13px] text-text-muted hover:text-white transition-all cursor-pointer"
                  type="button"
                >
                  <span className="text-primary font-bold">$</span>
                  <span className="text-text-main font-mono">npx @handoff/cli init</span>
                  {copiedCli ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-soft group-hover:text-primary transition-colors" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[12px] font-mono text-text-soft">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  <span>OAuth 2.0 + PKCE only</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>Isolated tenant vaults</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span>Zero daemon background telemetry</span>
                </span>
              </div>
            </div>

            {/* HERO DUAL-PANE SHOWCASE */}
            <div className="mt-12 max-w-6xl mx-auto rounded-2xl bg-surface/90 border border-border-hairline shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
              {/* Top Window Header Bar */}
              <div className="px-5 py-3.5 bg-surface-subtle/80 border-b border-border-hairline flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700 inline-block" />
                  </div>
                  <span className="text-text-soft font-mono text-xs">/</span>
                  <div className="flex items-center gap-2 font-mono text-xs text-text-main">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>mesh://session/active-trace-9942</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-text-soft">
                    LOCK_LEASE: <span className="text-primary font-medium">ACTIVE (240s)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary uppercase font-semibold">
                    Zero-Leak Sandbox
                  </span>
                </div>
              </div>

              {/* Dual-Pane Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-hairline bg-canvas/40">
                {/* Left Pane: Visual Node Graph */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-text-soft">Cross-Agent Pipeline</span>
                        <h3 className="text-lg font-semibold text-text-main">Live Memory Beam Transfer</h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-border-hairline text-[11px] font-mono text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        Transferring AST Diffs
                      </span>
                    </div>

                    {/* Animated Diagram */}
                    <div className="relative py-8 px-4 rounded-xl bg-surface border border-border-hairline/60 overflow-hidden">
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-800" />
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[2px] overflow-hidden pointer-events-none">
                        <div className="w-40 h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-beam-flow" />
                      </div>
                      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                        {/* Source Node */}
                        <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-surface-container border border-primary/40 shadow-[0_0_20px_rgba(62,207,142,0.15)] w-44 hover:border-primary transition-all">
                          <div className="w-10 h-10 rounded-lg bg-surface border border-border-hairline flex items-center justify-center font-mono font-bold text-primary mb-2 shadow-inner">
                            C
                          </div>
                          <span className="font-semibold text-xs text-text-main">Claude 3.7 Sonnet</span>
                          <span className="text-[10px] font-mono text-text-soft mt-0.5">Anthropic &bull; Source</span>
                          <span className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">Brief Exported</span>
                        </div>

                        {/* Flow Core */}
                        <div className="flex flex-col items-center">
                          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-surface-container-high border border-primary/60 shadow-[0_0_30px_rgba(62,207,142,0.3)]">
                            <ArrowLeftRight className="w-6 h-6 text-primary" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
                          </div>
                          <span className="text-[11px] font-mono text-primary font-medium mt-2">34ms p95</span>
                          <span className="text-[10px] font-mono text-text-soft">1,420 tokens</span>
                        </div>

                        {/* Target Nodes */}
                        <div className="flex flex-col gap-2.5 w-44">
                          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container border border-secondary/40 shadow-sm hover:border-secondary transition-all">
                            <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center font-mono font-bold text-secondary text-xs">
                              4o
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-xs text-text-main">ChatGPT-4o</div>
                              <div className="text-[9px] font-mono text-text-soft">Ingested brief</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container border border-border-hairline hover:border-primary/50 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center font-mono font-semibold text-text-main text-xs">
                              ⚡
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-xs text-text-main">Cursor IDE</div>
                              <div className="text-[9px] font-mono text-text-soft">Lock claimed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-border-hairline text-left">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-text-soft block">Payload</span>
                      <span className="font-mono text-sm font-semibold text-text-main">1,420 tokens</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-text-soft block">Compression</span>
                      <span className="font-mono text-sm font-semibold text-primary">68% reduced</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-text-soft block">Isolation</span>
                      <span className="font-mono text-sm font-semibold text-text-main">Tenant #9942</span>
                    </div>
                  </div>
                </div>

                {/* Right Pane: Telemetry Inspector */}
                <div className="lg:col-span-5 p-6 bg-surface/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />
                        <span className="font-mono text-xs text-text-main font-medium">telemetry.task.inspect</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border-hairline text-text-soft">
                        E2E ENCRYPTED
                      </span>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-canvas border border-border-hairline font-mono text-[11px] leading-relaxed overflow-x-auto text-neutral-300">
                      <span className="text-text-soft">// State Shard Handoff Payload</span>
                      <br />
                      <span className="text-secondary">&quot;event&quot;</span>: <span className="text-primary">&quot;handoff.state.mesh&quot;</span>,
                      <br />
                      <span className="text-secondary">&quot;source_agent&quot;</span>: <span className="text-text-main">&quot;claude-3.7-sonnet&quot;</span>,
                      <br />
                      <span className="text-secondary">&quot;target_agent&quot;</span>: <span className="text-text-main">&quot;gpt-4o&quot;</span>,
                      <br />
                      <span className="text-secondary">&quot;file_claimed&quot;</span>: <span className="text-text-main">&quot;src/billing/stripe.ts&quot;</span>,
                      <br />
                      <span className="text-secondary">&quot;optimistic_lock&quot;</span>: <span className="text-primary">true</span>,
                      <br />
                      <span className="text-secondary">&quot;crypto_hash&quot;</span>: <span className="text-signal-amber">&quot;sha256:0x7f8a9e21...&quot;</span>,
                      <br />
                      <span className="text-secondary">&quot;context_delta&quot;</span>: &#123;
                      <br />
                      &nbsp;&nbsp;<span className="text-secondary">&quot;ast_diff_lines&quot;</span>: <span className="text-primary">+42</span>,
                      <br />
                      &nbsp;&nbsp;<span className="text-secondary">&quot;tests_passed&quot;</span>: <span className="text-primary">14</span>,
                      <br />
                      &nbsp;&nbsp;<span className="text-secondary">&quot;session_scope&quot;</span>: <span className="text-text-muted">&quot;auth_tokens_isolated&quot;</span>
                      <br />
                      &#125;
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-surface border border-border-hairline flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Signature Validated</span>
                    </span>
                    <span className="text-primary font-semibold">0 leaks detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE TOOLCHAIN */}
        <section className="border-y border-border-hairline bg-surface/40 py-6 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 mb-3 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-soft">
              Works natively across your existing developer toolchain
            </p>
          </div>
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee flex items-center gap-12 font-mono text-sm text-text-muted">
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-bold text-white">GitHub</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="text-primary font-bold">▲</span> Vercel
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="text-primary font-bold">⚡</span> Supabase
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Linear</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Slack</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Notion</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Figma</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-signal-red">Sentry</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-signal-amber">PostHog</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">AWS Secrets</span>
              </span>

              {/* Duplicated for smooth infinite loop */}
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-bold text-white">GitHub</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="text-primary font-bold">▲</span> Vercel
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="text-primary font-bold">⚡</span> Supabase
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Linear</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Slack</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Notion</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">Figma</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-signal-red">Sentry</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-signal-amber">PostHog</span>
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                <span className="font-semibold text-white">AWS Secrets</span>
              </span>
            </div>
          </div>
        </section>

        {/* 4 METRICS BENTO STRIP */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between text-text-soft text-xs font-mono uppercase tracking-wider mb-2">
                <span>Ecosystem</span>
                <Network className="w-4.5 h-4.5 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-text-main">45+</div>
              <div className="text-xs text-text-muted mt-1 font-sans">Hub tools (memory, handoff, locks)</div>
              <div className="mt-3 pt-2.5 border-t border-border-hairline flex items-center gap-1.5 text-[11px] font-mono text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Tool schemas autodiscovered</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between text-text-soft text-xs font-mono uppercase tracking-wider mb-2">
                <span>Security Model</span>
                <Unlock className="w-4.5 h-4.5 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-text-main">0</div>
              <div className="text-xs text-text-muted mt-1 font-sans">Passwords stored. PKCE direct only</div>
              <div className="mt-3 pt-2.5 border-t border-border-hairline flex items-center gap-1.5 text-[11px] font-mono text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Zero raw tokens kept</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between text-text-soft text-xs font-mono uppercase tracking-wider mb-2">
                <span>Performance</span>
                <Zap className="w-4.5 h-4.5 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-primary">&lt; 38ms</div>
              <div className="text-xs text-text-muted mt-1 font-sans">p95 cross-agent context handoff</div>
              <div className="mt-3 pt-2.5 border-t border-border-hairline flex items-center gap-1.5 text-[11px] font-mono text-text-soft">
                <span>Global Edge KV replication</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between text-text-soft text-xs font-mono uppercase tracking-wider mb-2">
                <span>Reliability</span>
                <CheckCircle2 className="w-4.5 h-4.5 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight text-text-main">99.98%</div>
              <div className="text-xs text-text-muted mt-1 font-sans">Telemetry claim and lock resolution</div>
              <div className="mt-3 pt-2.5 border-t border-border-hairline flex items-center gap-1.5 text-[11px] font-mono text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Conflict-free sync mesh</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS IN 3 STEPS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" id="how-it-works">
          <div className="max-w-2xl mb-10">
            <span className="text-primary font-mono text-xs uppercase tracking-wider block mb-2">SEAMLESS CONTEXT WORKFLOW</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">How it works in 3 lightweight steps</h2>
            <p className="text-text-muted text-sm mt-1">No daemon processes to babysit. Just native hooks into your AI prompts and tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-xl bg-surface border border-border-hairline flex flex-col justify-between hover:border-border-medium hover:-translate-y-0.5 transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-hairline flex items-center justify-center font-mono font-bold text-xs text-primary mb-4">
                  01
                </div>
                <h3 className="text-base font-semibold text-text-main mb-2">Claim &amp; Lock</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  When Claude or Cursor begins editing, it claims files via optimistic locks so another assistant won&apos;t overwrite ongoing refactors.
                </p>
              </div>
              <div className="mt-6 p-2.5 rounded-lg bg-canvas border border-border-hairline font-mono text-[11px] text-text-muted flex items-center justify-between">
                <span className="text-secondary">$ handoff.claim(&quot;src/api&quot;)</span>
                <span className="text-primary font-medium">LOCKED</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border-hairline flex flex-col justify-between hover:border-border-medium hover:-translate-y-0.5 transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-hairline flex items-center justify-center font-mono font-bold text-xs text-primary mb-4">
                  02
                </div>
                <h3 className="text-base font-semibold text-text-main mb-2">Synthesize &amp; Hand Off</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  A context brief is packed in 34ms—summarizing decisions, AST diffs, and failing tests—without sending irrelevant token bloat.
                </p>
              </div>
              <div className="mt-6 p-2.5 rounded-lg bg-canvas border border-border-hairline font-mono text-[11px] text-text-muted flex items-center justify-between">
                <span className="text-text-main">Brief 1,420 tkns</span>
                <span className="text-primary font-medium">COMPRESSED</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border-hairline flex flex-col justify-between hover:border-border-medium hover:-translate-y-0.5 transition-all">
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-hairline flex items-center justify-center font-mono font-bold text-xs text-primary mb-4">
                  03
                </div>
                <h3 className="text-base font-semibold text-text-main mb-2">Resume Seamlessly</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Open ChatGPT-4o, Windsurf, or terminal. The target model ingests the state shard immediately, carrying on with 100% precision.
                </p>
              </div>
              <div className="mt-6 p-2.5 rounded-lg bg-canvas border border-border-hairline font-mono text-[11px] text-text-muted flex items-center justify-between">
                <span className="text-text-main">GPT-4o runtime</span>
                <span className="text-primary font-medium">RESUMED</span>
              </div>
            </div>
          </div>
        </section>

        {/* CORE ENGINE STREAM */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border-hairline" id="core-engine">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span>CORE ENGINE // MESH ARCHITECTURE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
                Built for developers who jump between models
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
                Persistent context shards, hardware-isolated file leases, and zero raw credentials.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-hairline text-xs font-mono text-text-muted">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Global KV: 18ms latency</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* 3 Pillars */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div className="p-5 rounded-xl bg-surface border border-primary/50 shadow-[0_0_20px_rgba(62,207,142,0.1)] transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-white transition-colors">
                      Cross-AI Shared Memory
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary uppercase font-medium">
                    Active
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Claude, GPT-4o, and Cursor share verified AST diffs and architectural decisions in one cryptographically isolated state shard.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-border-medium hover:bg-surface-hover transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4.5 h-4.5 text-text-soft group-hover:text-primary transition-colors" />
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-white transition-colors">
                      Zero-Retention File Locks
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-text-soft uppercase font-medium">
                    Optimistic
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Prevent overwriting code simultaneously. Claim temporary leases with customer-managed AES-GCM-256 keys.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-border-hairline hover:border-border-medium hover:bg-surface-hover transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4.5 h-4.5 text-text-soft group-hover:text-secondary transition-colors" />
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-white transition-colors">
                      Instant Native Tool Auth
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-text-soft uppercase font-medium">
                    PKCE
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Direct OAuth 2.0 with GitHub, Supabase, and Vercel. Assistants inspect data without ever holding master API secrets.
                </p>
              </div>
            </div>

            {/* TypeScript SDK snippet terminal */}
            <div className="lg:col-span-7 rounded-xl bg-surface border border-border-hairline overflow-hidden shadow-2xl flex flex-col justify-between">
              <div className="px-4 py-3 bg-surface-subtle border-b border-border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
                  <span className="text-text-soft ml-2">handoff-quickstart.ts</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-text-soft">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-primary font-medium">TypeScript SDK</span>
                </div>
              </div>

              <div className="p-5 sm:p-6 font-mono text-xs text-text-main leading-relaxed bg-canvas space-y-3 overflow-x-auto">
                <div>
                  <span className="text-text-soft"># 1. Initialize project vault</span>
                  <br />
                  <span className="text-primary">$</span> <span className="text-white font-medium">npx @handoff/cli init</span>
                </div>
                <div className="pt-2 border-t border-border-hairline/60">
                  <span className="text-text-soft">// 2. Attach context hook</span>
                  <br />
                  <span className="text-secondary">import</span> &#123; useHandoff &#125; <span className="text-secondary">from</span>{" "}
                  <span className="text-primary">&quot;@handoff/sdk&quot;</span>;
                  <br />
                  <span className="text-secondary">const</span> mesh = <span className="text-primary">useHandoff</span>(&#123; vault:{" "}
                  <span className="text-signal-amber">&quot;acme-prod&quot;</span> &#125;);
                </div>
                <div className="pt-2 border-t border-border-hairline/60">
                  <span className="text-text-soft">// 3. One-line state handoff with optimistic file lock</span>
                  <br />
                  <span className="text-secondary">await</span> mesh.<span className="text-primary">transfer</span>(&#123;
                  <br />
                  &nbsp;&nbsp;<span className="text-text-muted">from</span>: <span className="text-primary">&quot;claude-3.7-sonnet&quot;</span>,
                  <br />
                  &nbsp;&nbsp;<span className="text-text-muted">to</span>: <span className="text-secondary">&quot;chatgpt-4o&quot;</span>,
                  <br />
                  &nbsp;&nbsp;<span className="text-text-muted">paths</span>: [<span className="text-signal-amber">&quot;src/billing/*&quot;</span>]
                  <br />
                  &#125;);
                </div>
              </div>

              <div className="px-5 py-3 bg-surface-subtle border-t border-border-hairline flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-text-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Trace: <span className="text-primary">#hnd-9942</span>
                  </span>
                  <span className="text-text-soft">•</span>
                  <span>1,420 tkns compressed in 34ms</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-semibold">
                  Zero Leaks Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border-hairline" id="faq">
          <div className="text-center mb-10">
            <span className="text-primary font-mono text-xs uppercase tracking-wider block mb-2">COMMON QUESTIONS</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-main">
              Engineered for security-conscious teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className={`p-4 rounded-xl bg-surface border transition-all cursor-pointer ${isOpen ? "border-primary/50 shadow-[0_0_20px_rgba(62,207,142,0.1)]" : "border-border-hairline hover:border-border-medium"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-text-main text-sm">{faq.q}</h3>
                    <Plus className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-45 text-primary" : "text-text-soft"}`} />
                  </div>
                  {isOpen && <p className="text-xs text-text-muted leading-relaxed mt-2.5 pt-2 border-t border-border-hairline/60">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" id="get-started">
          <div className="relative rounded-2xl bg-surface border border-border-hairline p-8 sm:p-12 overflow-hidden shadow-[0_20px_90px_rgba(0,0,0,0.9)]">
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
            <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-secondary/15 blur-[120px] rounded-full" />

            <div className="relative z-10 max-w-2xl">
              <span className="font-mono text-xs text-primary uppercase tracking-wider block mb-2 font-semibold">
                ZERO CODE RE-EXPLAINING
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                Stop re-explaining yourself to AI.
              </h2>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Spin up an isolated tenant session in 30 seconds. Connect your favorite models, claim repo locks, and hand off seamlessly with full auditability.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  style={{ color: "#000000" }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98]"
                  href="/login"
                >
                  <span>Get started in 30 seconds</span>
                  <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-subtle border border-border-hairline text-text-muted hover:text-white font-mono text-xs transition-colors"
                  href="/connect/setup"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>View Quickstart Guide</span>
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-mono text-text-soft">
                <span>✓ No credit card required</span>
                <span>✓ SOC2 Type II certified</span>
                <span>✓ Free tier includes 100 handoffs/mo</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border-hairline bg-canvas py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-text-muted">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-white font-semibold">Status:</span>
              <span>All systems operational (100.0% uptime)</span>
            </div>

            <div className="flex items-center flex-wrap justify-center gap-5 font-mono text-xs">
              <Link className="hover:text-white transition-colors" href="/terms">
                Terms of Service
              </Link>
              <Link className="hover:text-white transition-colors" href="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-white transition-colors" href="/support">
                Support
              </Link>
            </div>

            <div className="font-mono text-text-soft text-[11px]">
              &copy; 2025 Handoff Hub Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

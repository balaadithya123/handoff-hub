"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Zap,
  Key,
  Shield,
  Terminal,
  Check,
  Copy,
  ArrowLeftRight,
  Lock,
  Cable,
  Cpu,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  Network,
  Unlock,
} from "lucide-react";
import PublicHeader from "./PublicHeader";

interface ToolIntegration {
  id: string;
  name: string;
  category: "Code & Deploy" | "Memory & Docs" | "Communication" | "Database & Infra";
  status: "Connected" | "Available" | "Featured";
  iconName: string;
  description: string;
}

const TOOL_INTEGRATIONS: ToolIntegration[] = [
  { id: "github", name: "GitHub", category: "Code & Deploy", status: "Connected", iconName: "github", description: "Repository context, PR status, code review sync" },
  { id: "vercel", name: "Vercel", category: "Code & Deploy", status: "Connected", iconName: "vercel", description: "Deployment preview telemetry and environment variables" },
  { id: "supabase", name: "Supabase", category: "Database & Infra", status: "Connected", iconName: "database", description: "Schema definition, migration logs, row-level policy audits" },
  { id: "notion", name: "Notion", category: "Memory & Docs", status: "Available", iconName: "file-text", description: "PRD sync, team decision tracking, architecture notes" },
  { id: "slack", name: "Slack", category: "Communication", status: "Available", iconName: "message-square", description: "Agent notifications, human-in-the-loop approvals" },
  { id: "linear", name: "Linear", category: "Memory & Docs", status: "Featured", iconName: "check-square", description: "Issue triage, sprint progress, context-linked tickets" },
  { id: "figma", name: "Figma", category: "Memory & Docs", status: "Available", iconName: "figma", description: "Design component tokens and frame inspection" },
  { id: "sentry", name: "Sentry", category: "Database & Infra", status: "Featured", iconName: "alert-triangle", description: "Crash trace parsing and error context handoff" },
];

const CODE_EXAMPLES = {
  python: `from handoff import HandoffMesh, AgentSession

mesh = HandoffMesh(api_key="ho_live_9f82d1c")
session = mesh.init_session("claude-3-5-sonnet")

# Context save without sharing keys
session.push_context(
    target_agent="chatgpt-4o",
    state={"auth_scope": "read:repo", "ast_snapshot": "v2.1"},
    ttl=3600
)
print("Mesh Handoff Handshake Complete.")`,
  typescript: `import { HandoffMesh } from "@handoff/sdk";

const mesh = new HandoffMesh({ key: process.env.HANDOFF_KEY });

await mesh.transfer({
  from: "cursor-agent",
  to: "claude-code",
  payload: { repo: "org/core", commit: "3a7d66c" },
  isolateCredentials: true,
});
console.log("Context transferred securely!");`,
  cli: `# Initialize context handoff in terminal
handoff login --token ho_mesh_882a
handoff link --agent claude --scope repo:read
handoff sync --session active-sprint-42`,
};

const FAQS = [
  {
    q: "How does Handoff Hub Mesh 2.0 prevent API key leaks?",
    a: "Mesh 2.0 uses OAuth 2.0 with PKCE and short-lived session proxies. Your AI agents request scoped authorization tokens via Handoff Hub without ever handling or seeing third-party passwords or raw API keys.",
  },
  {
    q: "Can I share context between Claude Code and ChatGPT?",
    a: "Yes! Context, memory state, and active decision trees are normalized into an account-isolated AST format. Claude Code can write a session snapshot that ChatGPT or Cursor reads instantly.",
  },
  {
    q: "Is there a self-hosted or enterprise deployment option?",
    a: "Handoff Hub Mesh 2.0 supports local Docker runtimes, self-hosted VPC deployments, and custom key management via AWS KMS or HashiCorp Vault.",
  },
  {
    q: "How does account isolation work across workspace teams?",
    a: "Every workspace is assigned an isolated encryption boundary. Token claims and memory pools are cryptographic sub-keys restricted strictly to authorized user accounts.",
  },
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState<"python" | "typescript" | "cli">("python");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNode, setActiveNode] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredIntegrations = useMemo(() => {
    return TOOL_INTEGRATIONS.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-canvas text-text-heading font-sans antialiased flex flex-col relative overflow-hidden">
      {/* Background Grid & Aura Effects */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[120px] rounded-full animate-aura-drift pointer-events-none" />
      <div className="absolute top-[800px] -left-[200px] w-[600px] h-[600px] bg-secondary/10 blur-[140px] rounded-full pointer-events-none" />

      <PublicHeader />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 pt-8 pb-24 space-y-20 relative z-10">
        {/* HERO SECTION */}
        <section className="pt-8 sm:pt-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-mono text-primary shadow-inner">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-semibold tracking-wide">MESH 2.0 PROTOCOL LIVE</span>
              <span className="text-text-muted">&middot; ZERO-KEY ARCHITECTURE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              One context mesh for{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-300 to-secondary bg-clip-text text-transparent">
                all your AI agents.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-body leading-relaxed max-w-2xl font-normal">
              Seamlessly handoff project state, active memory, and third-party authorizations between Claude, ChatGPT, and Cursor — with isolated security and zero password exposure.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                style={{ color: "#000000" }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary hover:bg-emerald-300 text-black text-sm font-semibold transition-all shadow-[0_0_24px_rgba(96,236,168,0.35)] hover:shadow-[0_0_32px_rgba(96,236,168,0.5)] transform hover:-translate-y-0.5"
              >
                <span>Launch Mesh Portal</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
              </Link>
              <Link
                href="/connect/setup"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-white text-sm font-medium transition-all"
              >
                <Terminal className="w-4 h-4 text-primary" />
                <span>Explore Setup Guide</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-surface-border font-mono text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>OAuth 2.0 + PKCE</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Account Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>No API Key Leaks</span>
              </div>
            </div>
          </div>

          {/* HERO VISUALIZER (Mesh Beam) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-surface/95 border border-surface-border p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-beam-flow" />

              <div className="flex items-center justify-between pb-4 border-b border-surface-border font-mono text-xs">
                <span className="text-text-muted flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  <span>mesh_telemetry_v2.log</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  REALTIME HANDSHAKE
                </span>
              </div>

              {/* Node diagram */}
              <div className="py-6 space-y-4">
                <div className={`p-3.5 rounded-xl border transition-all duration-300 ${activeNode === 0 ? "bg-primary/10 border-primary text-white" : "bg-canvas/60 border-surface-border text-text-muted"}`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <Cpu className="w-4 h-4 text-primary" />
                      Claude Code
                    </span>
                    <span className="text-primary font-mono">pushed state snapshot</span>
                  </div>
                  <p className="text-xs font-mono text-text-body mt-1">
                    payload: &#123; repo: &quot;portal-mesh&quot;, scope: &quot;auth:pkce&quot; &#125;
                  </p>
                </div>

                <div className="flex justify-center my-1">
                  <ArrowLeftRight className="w-5 h-5 text-primary animate-pulse" />
                </div>

                <div className={`p-3.5 rounded-xl border transition-all duration-300 ${activeNode === 1 ? "bg-secondary/10 border-secondary text-white" : "bg-canvas/60 border-surface-border text-text-muted"}`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      ChatGPT-4o
                    </span>
                    <span className="text-secondary font-mono">syncing memory pool</span>
                  </div>
                  <p className="text-xs font-mono text-text-body mt-1">
                    memory_id: &quot;pool_99a_active&quot; &middot; 0.4ms latency
                  </p>
                </div>

                <div className="flex justify-center my-1">
                  <ArrowLeftRight className="w-5 h-5 text-primary animate-pulse" />
                </div>

                <div className={`p-3.5 rounded-xl border transition-all duration-300 ${activeNode === 2 ? "bg-emerald-500/10 border-emerald-500 text-white" : "bg-canvas/60 border-surface-border text-text-muted"}`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Handoff Isolated Vault
                    </span>
                    <span className="text-emerald-400 font-mono">credentials tokenized</span>
                  </div>
                  <p className="text-xs font-mono text-text-body mt-1">
                    zero key exposure &middot; 256-bit AES session
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between font-mono text-[11px] text-text-muted">
                <span>Mesh status: OPERATIONAL</span>
                <span className="text-primary font-semibold">100% Isolated</span>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE BANNER */}
        <section className="py-6 border-y border-surface-border/60 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee gap-8 items-center font-mono text-xs text-text-muted uppercase tracking-wider">
            <span>&bull; Cross-AI Memory Handoff</span>
            <span>&bull; OAuth 2.0 PKCE Protection</span>
            <span>&bull; No Third-Party Passwords</span>
            <span>&bull; Isolated Session Memory</span>
            <span>&bull; Instant Telemetry Inspection</span>
            <span>&bull; Claude + ChatGPT Sync</span>
            <span>&bull; Multi-Agent Context Exchange</span>
            {/* Duplicate for seamless looping */}
            <span>&bull; Cross-AI Memory Handoff</span>
            <span>&bull; OAuth 2.0 PKCE Protection</span>
            <span>&bull; No Third-Party Passwords</span>
            <span>&bull; Isolated Session Memory</span>
            <span>&bull; Instant Telemetry Inspection</span>
            <span>&bull; Claude + ChatGPT Sync</span>
            <span>&bull; Multi-Agent Context Exchange</span>
          </div>
        </section>

        {/* BENTO GRID METRICS & FEATURES */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-primary">
              <Zap className="w-3.5 h-3.5" />
              <span>CORE ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Engineered for absolute context persistence.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Zero-Key Vault</h3>
                <p className="text-sm text-text-body leading-relaxed">
                  Third-party API keys and OAuth credentials remain isolated inside encrypted user enclaves. AI agents never see raw secrets.
                </p>
              </div>
              <div className="font-mono text-xs text-primary pt-2 flex items-center gap-1.5">
                <span>PKCE Enclave Active</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Bidirectional Memory</h3>
                <p className="text-sm text-text-body leading-relaxed">
                  Decisions recorded by Claude Code are automatically formatted into structured AST context for ChatGPT, Cursor, and custom bots.
                </p>
              </div>
              <div className="font-mono text-xs text-secondary pt-2 flex items-center gap-1.5">
                <span>Unified AST Memory</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Cable className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Account Isolation</h3>
                <p className="text-sm text-text-body leading-relaxed">
                  Sessions are strictly bounded to individual authenticated accounts. Memory leaks between users or workspaces are mathematically impossible.
                </p>
              </div>
              <div className="font-mono text-xs text-emerald-400 pt-2 flex items-center gap-1.5">
                <span>Cryptographic Boundaries</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* CODE & TELEMETRY INSPECTOR */}
        <section className="p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div>
              <h3 className="text-2xl font-bold text-white">Developer SDK & AST Handoff</h3>
              <p className="text-sm text-text-body mt-1">
                Integrate Handoff Hub Mesh 2.0 into your AI workflows with two lines of code.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-canvas p-1 rounded-xl border border-surface-border font-mono text-xs">
              {(["python", "typescript", "cli"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${activeTab === lang ? "bg-surface-hover text-primary font-semibold border border-primary/20" : "text-text-muted hover:text-white"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl bg-canvas border border-surface-border p-5 font-mono text-xs overflow-x-auto">
            <button
              onClick={handleCopyCode}
              className="absolute top-4 right-4 p-2 rounded-lg bg-surface border border-surface-border hover:border-primary text-text-muted hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <pre className="text-text-body leading-relaxed">
              <code>{CODE_EXAMPLES[activeTab]}</code>
            </pre>
          </div>
        </section>

        {/* INTERACTIVE INTEGRATION DIRECTORY */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-primary">
                <Network className="w-3.5 h-3.5" />
                <span>CONNECTORS DIRECTORY</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Connect your tools without sharing secrets.
              </h2>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-mono text-white placeholder-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              >
                <option value="All">All Categories</option>
                <option value="Code & Deploy">Code & Deploy</option>
                <option value="Memory & Docs">Memory & Docs</option>
                <option value="Communication">Communication</option>
                <option value="Database & Infra">Database & Infra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredIntegrations.map((tool) => (
              <div
                key={tool.id}
                className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-bold text-white text-base group-hover:text-primary transition-colors">
                      {tool.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${tool.status === "Connected" ? "bg-primary/10 text-primary border-primary/30" : "bg-surface-hover text-text-muted border-surface-border"}`}>
                      {tool.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-body leading-relaxed">{tool.description}</p>
                </div>

                <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>{tool.category}</span>
                  <Unlock className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (Accordion) */}
        <section className="space-y-6 pt-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-text-body">Everything you need to know about Mesh 2.0 security and architecture.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-surface border border-surface-border overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-semibold text-white flex items-center justify-between gap-4 hover:text-primary transition-colors"
                  >
                    <span className="text-base">{faq.q}</span>
                    <div className="p-1 rounded-lg bg-canvas border border-surface-border text-text-muted">
                      {isOpen ? <Minus className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-text-body leading-relaxed border-t border-surface-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="p-10 rounded-3xl bg-gradient-to-br from-surface via-surface-hover to-surface border border-surface-border text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to unify your AI context?
            </h2>
            <p className="text-sm text-text-body leading-relaxed">
              Join developers using Handoff Hub Mesh 2.0 to eliminate context repetition and key management overhead.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/login"
                style={{ color: "#000000" }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-emerald-300 text-black font-bold text-sm transition-all shadow-[0_0_32px_rgba(96,236,168,0.4)]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-surface-border py-8 bg-canvas text-xs font-mono text-text-muted relative z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Handoff Hub Mesh 2.0 &middot; Context Exchange Protocol</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

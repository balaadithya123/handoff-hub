import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, sessionUser } from "../lib/portal";
import { connectionStatus } from "../lib/connections";
import Shell, { type Tab } from "./components/Shell";
import ConnectorDirectory from "./components/ConnectorDirectory";
import AiAccounts from "./components/AiAccounts";
import ActivityLog from "./components/ActivityLog";
import Overview from "./components/Overview";
import HubTools from "./components/HubTools";
import Projects from "./components/Projects";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";

export const dynamic = "force-dynamic";

type Notice = { kind: "error" | "ok"; text: string } | null;

const META: Record<Tab, [string, string]> = {
  overview: ["Overview", "Your Handoff Hub account at a glance."],
  integrations: ["Integrations", "Connect your tools with their own sign-in. Handoff Hub never sees your passwords."],
  projects: ["Projects & Pools", "Separate memory pools your AI apps can save to."],
  ai: ["AI Accounts", "Link the AI accounts that use your connections."],
  tools: ["Hub Tools & Controls", "Allowlist, workload, claims, approvals, health checks and context brief."],
  activity: ["Activity & Telemetry", "What your AI accounts did through the Hub, across all projects."],
};

const APPS = [
  "GitHub",
  "Vercel",
  "Supabase",
  "Notion",
  "Slack",
  "Linear",
  "Figma",
  "Canva",
  "Google Drive",
  "Gmail",
  "Sentry",
  "Jira",
];

function Landing() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans flex flex-col justify-between">
      {/* Landing Topbar */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-sm shadow-sm">
            H
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#ededed]">Handoff Hub</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/connect/setup" className="text-xs text-[#a1a1a1] hover:text-[#ededed] transition-colors">
            How it works
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">Sign in</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="green" pulse>
              SECURE MULTI-MODEL INTEGRATIONS
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#ededed] leading-[1.1]">
              Your apps. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#3ecf8e] to-[#5eead4]">
                One secure handoff.
              </span>
            </h1>

            <p className="text-sm text-[#a1a1a1] leading-relaxed max-w-xl">
              Connect the tools you already use to power AI workflows in Claude, ChatGPT, and Cursor. Authorize directly via OAuth with credentials isolated to your account.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link href="/login">
                <Button variant="primary" size="lg">Get Started Free</Button>
              </Link>
              <Link href="/connect/setup">
                <Button variant="secondary" size="lg">Learn How It Works &rarr;</Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#8a8a8a] font-mono pt-4 border-t border-white/10">
              <span>✓ OAuth 2.0 PKCE Authorization</span>
              <span>✓ Account-Isolated Tokens</span>
              <span>✓ Zero Plaintext Passwords</span>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-semibold text-[#8a8a8a]">HANDOFF PIPELINE</span>
              <Badge variant="green" pulse>LIVE GATEWAY</Badge>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#111] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[#3ecf8e] font-bold block">01 // AUTHORIZE</span>
                  <span className="text-[#ededed]">User OAuth Sign-In</span>
                </div>
                <Badge variant="grey" dot={false}>PKCE</Badge>
              </div>
              <div className="p-3 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-between">
                <div>
                  <span className="text-[#3ecf8e] font-bold block">02 // CONTEXT HANDOFF</span>
                  <span className="text-[#ededed]">Encrypted Token Scope</span>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
              <div className="p-3 rounded-lg bg-[#111] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[#3ecf8e] font-bold block">03 // AI RUNTIME</span>
                  <span className="text-[#ededed]">Claude / ChatGPT MCP Tool</span>
                </div>
                <Badge variant="grey" dot={false}>Connected</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee Banner */}
        <div className="py-6 border-y border-white/10 overflow-hidden">
          <div className="flex items-center justify-around text-xs font-mono text-[#8a8a8a] gap-8 overflow-x-auto whitespace-nowrap">
            {APPS.map((app) => (
              <span key={app} className="hover:text-[#ededed] transition-colors cursor-default">
                {app}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-white/10 text-center text-xs text-[#8a8a8a]">
        Handoff Hub &middot; Secure Context Handoff for AI Workflows
      </footer>
    </div>
  );
}

async function Dashboard({
  email,
  token,
  tab,
  notice,
  project,
}: {
  email: string;
  token: string;
  tab: Tab;
  notice: Notice;
  project: string;
}) {
  const connections = await connectionStatus(token).catch(() => []);
  const names: Record<string, string> = {};
  for (const c of connections) {
    if (c.provider_account_name) names[c.provider] = c.provider_account_name;
  }
  const [title, sub] = META[tab];

  return (
    <Shell email={email} tab={tab} title={title} sub={sub} notice={notice}>
      {tab === "integrations" ? (
        <ConnectorDirectory connected={connections.map((c) => c.provider as string)} names={names} />
      ) : tab === "projects" ? (
        <Projects token={token} />
      ) : tab === "ai" ? (
        <AiAccounts token={token} />
      ) : tab === "tools" ? (
        <HubTools token={token} />
      ) : tab === "activity" ? (
        <ActivityLog token={token} limit={30} project={project} filters />
      ) : (
        <Overview token={token} connected={connections.length} />
      )}
    </Shell>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token);
  const sp = (await searchParams) || {};
  const err = typeof sp.connection_error === "string" ? sp.connection_error : "";
  const ok = typeof sp.connected === "string" ? sp.connected : "";
  const notice: Notice = err ? { kind: "error", text: err } : ok ? { kind: "ok", text: "Connected " + ok + "." } : null;
  const t = typeof sp.tab === "string" ? sp.tab : "";
  const tab: Tab =
    t === "integrations" || t === "projects" || t === "ai" || t === "tools" || t === "activity" || t === "overview"
      ? t
      : notice
      ? "integrations"
      : "overview";
  const project = typeof sp.project === "string" ? sp.project.slice(0, 80) : "";

  return user && token ? (
    <Dashboard email={user.email} token={token} tab={tab} notice={notice} project={project} />
  ) : (
    <Landing />
  );
}

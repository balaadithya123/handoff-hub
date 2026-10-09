import Link from "next/link";
import { Plug, Bot, FolderKanban, Activity, ArrowRight, CheckCircle2, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { getAiApps, getProjects, getConnections } from "../../lib/data";
import ActivityLog from "./ActivityLog";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export default async function Overview({ token, connected }: { token: string; connected: number }) {
  const [aiData, projectsData, connectionsData] = await Promise.all([
    getAiApps(token).catch(() => null),
    getProjects(token).catch(() => null),
    getConnections(token).catch(() => []),
  ]);

  const accts = aiData?.accounts ?? [];
  const clientCount = accts.reduce((n, a) => n + (a.clients?.length ?? 0), 0);
  const totalProjects = (projectsData?.accounts ?? []).reduce((n, a) => n + (a.projects?.length ?? 0), 0);

  const steps = [
    { label: "Connect an integration", done: connected > 0, href: "/integrations", cta: "Manage integrations" },
    { label: "Link an AI account (Claude / ChatGPT)", done: accts.length > 0, href: "/ai", cta: "Link account" },
    { label: "Create a memory pool project", done: totalProjects > 0, href: "/projects", cta: "View projects" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" pulse>WORKSPACE ACTIVE</Badge>
            <span className="text-xs text-[#8a8a8a]">•</span>
            <span className="text-xs font-mono text-[#3ecf8e]">Multi-model Telemetry Sync</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">Overview</h1>
          <p className="text-xs text-[#a1a1a1] mt-0.5">
            Real-time status of your connected integrations, AI runtimes, memory pools, and activity.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/integrations">
            <Button variant="primary" size="sm" icon={<Plug className="w-3.5 h-3.5" />}>
              Add Integration
            </Button>
          </Link>
          <Link href="/ai">
            <Button variant="secondary" size="sm" icon={<Bot className="w-3.5 h-3.5" />}>
              Link AI Account
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Bento Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card
          glow
          eyebrow="Integrations"
          title={
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#ededed] font-mono">{connected}</span>
              <span className="text-xs text-[#3ecf8e] font-mono flex items-center gap-1">
                <Plug className="w-3 h-3" /> Live
              </span>
            </div>
          }
          action={
            <Link href="/integrations" className="text-[#a1a1a1] hover:text-[#ededed] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] pt-2 border-t border-white/5">
            <span>OAuth Authorized</span>
            <Link href="/integrations" className="text-[#3ecf8e] hover:underline flex items-center gap-0.5">
              <span>Directory</span> &rarr;
            </Link>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card
          glow
          eyebrow="AI Accounts"
          title={
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#ededed] font-mono">{accts.length}</span>
              <span className="text-xs text-[#5eead4] font-mono">{clientCount} clients</span>
            </div>
          }
          action={
            <Link href="/ai" className="text-[#a1a1a1] hover:text-[#ededed] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] pt-2 border-t border-white/5">
            <span>Claude / ChatGPT</span>
            <Link href="/ai" className="text-[#3ecf8e] hover:underline flex items-center gap-0.5">
              <span>View clients</span> &rarr;
            </Link>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card
          glow
          eyebrow="Projects & Pools"
          title={
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#ededed] font-mono">{totalProjects}</span>
              <span className="text-xs text-[#8a8a8a] font-mono">Isolated</span>
            </div>
          }
          action={
            <Link href="/projects" className="text-[#a1a1a1] hover:text-[#ededed] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] pt-2 border-t border-white/5">
            <span>Memory Pools</span>
            <Link href="/projects" className="text-[#3ecf8e] hover:underline flex items-center gap-0.5">
              <span>Configure</span> &rarr;
            </Link>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card
          glow
          eyebrow="Cluster Health"
          title={
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#ededed] font-mono">99.98%</span>
              <Badge variant="green" dot={false}>32ms</Badge>
            </div>
          }
        >
          <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] pt-2 border-t border-white/5">
            <span>Gateway Proxy</span>
            <span className="text-[#3ecf8e]">Operational</span>
          </div>
        </Card>
      </div>

      {/* Onboarding Checklist Section */}
      <Card
        eyebrow="SETUP CHECKLIST"
        title="Get started with Handoff Hub"
        description="Follow these steps to complete your multi-model AI setup."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {steps.map((step, idx) => (
            <div
              key={step.label}
              className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                step.done
                  ? "bg-white/[0.02] border-white/10 text-[#a1a1a1]"
                  : "bg-[#111111] border-[#3ecf8e]/30 text-[#ededed]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold">
                  0{idx + 1}. {step.label}
                </span>
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3ecf8e] shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#f5b14a] animate-pulse shrink-0 mt-1" />
                )}
              </div>
              <Link href={step.href}>
                <Button
                  variant={step.done ? "ghost" : "primary"}
                  size="sm"
                  className="w-full text-xs"
                >
                  {step.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Bento Grid: Activity & AI Runtimes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3ecf8e]" />
              <h2 className="text-base font-semibold text-[#ededed]">Live Trace Feed</h2>
            </div>
            <Link
              href="/activity"
              className="text-xs text-[#3ecf8e] hover:underline flex items-center gap-1"
            >
              <span>View full audit log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#111] flex items-center justify-between text-xs">
              <span className="font-mono text-[#8a8a8a]">RECENT EVENTS STREAM</span>
              <Badge variant="green" pulse>LIVE</Badge>
            </div>
            <div className="p-4">
              <ActivityLog token={token} limit={6} />
            </div>
          </Card>
        </div>

        {/* Right Sidebar Bento Module (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#5eead4]" />
            <h2 className="text-base font-semibold text-[#ededed]">AI Runtimes</h2>
          </div>

          <Card eyebrow="CONNECTED CLIENTS">
            {accts.length === 0 ? (
              <div className="text-xs text-[#8a8a8a] py-4 text-center">
                No AI accounts linked yet.
                <div className="mt-2">
                  <Link href="/ai">
                    <Button variant="secondary" size="sm">Link Claude or ChatGPT</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {accts.map((acct) => (
                  <div key={acct.id} className="p-3 rounded-lg bg-[#111] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#ededed]">{acct.label}</span>
                      <Badge variant="green">Linked</Badge>
                    </div>
                    <div className="text-[11px] font-mono text-[#8a8a8a]">
                      Clients: {acct.clients?.length ?? 0} active
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card eyebrow="SYSTEM SECURITY" title="OAuth Isolation">
            <p className="text-xs text-[#a1a1a1] leading-relaxed mb-3">
              Your integration credentials and access tokens are strictly encrypted and scoped to your account.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#3ecf8e]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero plain-text password storage</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

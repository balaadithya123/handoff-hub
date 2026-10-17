import Link from "next/link";
import {
  Plug,
  Bot,
  FolderKanban,
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getAiApps, getProjects, getConnections, getHubOverview } from "../../lib/data";
import { ago } from "../../lib/format";
import ActivityLog from "./ActivityLog";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import Logo from "./Logo";

export default async function Overview({ token, connected }: { token: string; connected: number }) {
  const [aiData, projectsData, connectionsData, hubData] = await Promise.all([
    getAiApps(token).catch(() => null),
    getProjects(token).catch(() => null),
    getConnections(token).catch(() => []),
    getHubOverview(token).catch(() => null),
  ]);

  const checks = (hubData?.hubs ?? []).flatMap((h) => h.health ?? []).filter((c) => c.at);
  checks.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const lastCheck = checks[0];
  const issues = lastCheck?.anomalies?.length ?? 0;

  const accts = aiData?.accounts ?? [];
  const clientCount = accts.reduce((n, a) => n + (a.clients?.length ?? 0), 0);
  const totalProjects = (projectsData?.accounts ?? []).reduce((n, a) => n + (a.projects?.length ?? 0), 0);

  // Pending tasks across hubs → drives the orbital “task active” state on the logo
  const pendingTasks = (hubData?.hubs ?? []).reduce((n, h) => {
    const tasks = Array.isArray(h.tasks) ? h.tasks : [];
    return n + tasks.filter((t: { status?: string }) => t.status !== "done").length;
  }, 0);
  const taskActive = pendingTasks > 0;

  const steps = [
    { label: "Connect an integration", done: connected > 0, href: "/integrations", cta: "Manage integrations" },
    { label: "Link an AI account (Claude / ChatGPT)", done: accts.length > 0, href: "/ai", cta: "Link account" },
    { label: "Create a memory pool project", done: totalProjects > 0, href: "/projects", cta: "View projects" },
  ];
  const setupDone = steps.every((s) => s.done);

  return (
    <div className="space-y-8">
      {/* Hero header with animated mark */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e7e4dc] bg-white p-6 md:p-8 shadow-[0_1px_0_rgba(20,20,20,0.04)]">
        <div className="absolute -right-8 -top-8 opacity-[0.07] pointer-events-none" aria-hidden>
          <Logo size={160} spinning={taskActive} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">
              <Logo size={44} spinning={taskActive} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="green" pulse>
                  {taskActive ? `${pendingTasks} TASK${pendingTasks === 1 ? "" : "S"} ACTIVE` : "WORKSPACE READY"}
                </Badge>
                {lastCheck?.version ? (
                  <span className="font-mono text-[11px] text-[#9a988f]">Hub v{lastCheck.version}</span>
                ) : null}
              </div>
              <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#141414]">
                Overview
              </h1>
              <p className="text-sm text-[#6f6e68] mt-1 max-w-xl leading-relaxed">
                Live status of integrations, AI runtimes, memory pools, and handoff activity.
                {taskActive
                  ? " Orbit is spinning while agents work on open tasks."
                  : " All systems idle — ready for the next handoff."}
              </p>
            </div>
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
      </div>

      {/* KPI row — light surface cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/integrations"
          className="group rounded-xl border border-[#e7e4dc] bg-white p-4 hover:border-[#d9d5cb] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Integrations</span>
            <Plug className="w-3.5 h-3.5 text-[#9a988f] group-hover:text-[#141414] transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#141414]">{connected}</span>
            <span className="text-xs text-[#2f6fe0] font-medium">Live</span>
          </div>
          <p className="text-[11px] text-[#9a988f] mt-2 flex items-center gap-1">
            OAuth directory <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/ai"
          className="group rounded-xl border border-[#e7e4dc] bg-white p-4 hover:border-[#d9d5cb] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">AI Accounts</span>
            <Bot className="w-3.5 h-3.5 text-[#9a988f] group-hover:text-[#141414] transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#141414]">{accts.length}</span>
            <span className="text-xs text-[#6f6e68] font-mono">{clientCount} clients</span>
          </div>
          <p className="text-[11px] text-[#9a988f] mt-2 flex items-center gap-1">
            Claude / ChatGPT <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/projects"
          className="group rounded-xl border border-[#e7e4dc] bg-white p-4 hover:border-[#d9d5cb] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Projects & Pools</span>
            <FolderKanban className="w-3.5 h-3.5 text-[#9a988f] group-hover:text-[#141414] transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#141414]">{totalProjects}</span>
            <span className="text-xs text-[#6f6e68]">Isolated</span>
          </div>
          <p className="text-[11px] text-[#9a988f] mt-2 flex items-center gap-1">
            Memory pools <ChevronRight className="w-3 h-3" />
          </p>
        </Link>

        <div className="rounded-xl border border-[#e7e4dc] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Hub Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#9a988f]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono text-[#141414]">
              {!lastCheck ? "—" : issues === 0 ? "OK" : `${issues}`}
            </span>
            {lastCheck && (
              <span className={`text-xs font-medium ${issues === 0 ? "text-[#2f6fe0]" : "text-[#b07a3a]"}`}>
                {issues === 0 ? "Healthy" : "issue" + (issues === 1 ? "" : "s")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#9a988f] mt-2">
            {lastCheck?.at ? ago(lastCheck.at) : "Run a check from Hub tools"}
          </p>
        </div>
      </div>

      {/* Setup checklist */}
      {!setupDone && (
        <div className="rounded-2xl border border-[#e7e4dc] bg-white p-5 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#2f6fe0]" />
            <h2 className="text-sm font-semibold text-[#141414]">Get started with Axon</h2>
          </div>
          <p className="text-xs text-[#6f6e68] mb-4">Complete these steps to unlock multi-model handoffs.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                  step.done
                    ? "bg-[#f6f5f2] border-[#e7e4dc] text-[#6f6e68]"
                    : "bg-white border-[#2f6fe0]/35 text-[#141414] shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold leading-snug">
                    <span className="font-mono text-[#9a988f] mr-1">0{idx + 1}.</span>
                    {step.label}
                  </span>
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2f6fe0] shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#b07a3a] animate-pulse shrink-0 mt-1" />
                  )}
                </div>
                <Link href={step.href}>
                  <Button variant={step.done ? "ghost" : "primary"} size="sm" className="w-full text-xs">
                    {step.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity + runtimes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2f6fe0]" />
              <h2 className="text-sm font-semibold text-[#141414]">Recent activity</h2>
            </div>
            <Link
              href="/activity"
              className="text-xs text-[#2f6fe0] hover:underline flex items-center gap-1"
            >
              Full audit log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#e7e4dc] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e7e4dc] bg-[#f6f5f2]/60 flex items-center justify-between text-xs">
              <span className="font-mono text-[#9a988f]">EVENT STREAM</span>
              <Badge variant="green" pulse>
                LIVE
              </Badge>
            </div>
            <div className="p-4">
              <ActivityLog token={token} limit={6} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#2f6fe0]" />
            <h2 className="text-sm font-semibold text-[#141414]">AI runtimes</h2>
          </div>

          <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 space-y-3">
            {accts.length === 0 ? (
              <div className="text-xs text-[#6f6e68] py-6 text-center">
                No AI accounts linked yet.
                <div className="mt-3">
                  <Link href="/ai">
                    <Button variant="secondary" size="sm">
                      Link Claude or ChatGPT
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              accts.map((acct) => (
                <div
                  key={acct.id}
                  className="rounded-xl border border-[#e7e4dc] bg-[#f6f5f2]/50 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#141414]">{acct.label}</span>
                    <Badge variant="green">Linked</Badge>
                  </div>
                  <div className="text-[11px] font-mono text-[#9a988f]">
                    {acct.clients?.length ?? 0} active client{(acct.clients?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">Security</p>
            <h3 className="text-sm font-semibold text-[#141414] mb-2">OAuth isolation</h3>
            <p className="text-xs text-[#6f6e68] leading-relaxed mb-3">
              Integration credentials and tokens are encrypted and scoped to your account only.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#2f6fe0]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>No plain-text password storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

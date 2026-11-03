import Link from "next/link";
import { Plug, Bot, FolderKanban, Activity, ArrowUpRight, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { getAiApps, getProjects, getHubOverview } from "../../lib/data";
import { ago } from "../../lib/format";
import ActivityLog from "./ActivityLog";

export default async function Overview({ token, connected }: { token: string; connected: number }) {
  const [aiData, projectsData, hubData] = await Promise.all([
    getAiApps(token).catch(() => null),
    getProjects(token).catch(() => null),
    getHubOverview(token).catch(() => null),
  ]);
  const checks = (hubData?.hubs ?? []).flatMap(h => h.health ?? []).filter(c => c.at);
  checks.sort((a,b) => String(b.at).localeCompare(String(a.at)));
  const lastCheck = checks[0];
  const issues = lastCheck?.anomalies?.length ?? 0;
  const accounts = aiData?.accounts ?? [];
  const clients = accounts.reduce((n,a) => n + (a.clients?.length ?? 0), 0);
  const projects = (projectsData?.accounts ?? []).reduce((n,a) => n + (a.projects?.length ?? 0), 0);
  const setup = [
    { label: "Connect an integration", href: "/integrations", done: connected > 0, action: "Browse integrations" },
    { label: "Link an AI account", href: "/ai", done: accounts.length > 0, action: "Connect AI account" },
    { label: "Create a memory pool", href: "/projects", done: projects > 0, action: "Open projects" },
  ];
  const complete = setup.every(s => s.done);
  const metrics = [
    { label: "Connected apps", value: String(connected), note: "OAuth connections", href: "/integrations", Icon: Plug },
    { label: "AI accounts", value: String(accounts.length), note: `${clients} linked clients`, href: "/ai", Icon: Bot },
    { label: "Projects", value: String(projects), note: "Memory pools", href: "/projects", Icon: FolderKanban },
    { label: "Hub health", value: !lastCheck ? "—" : issues ? String(issues) : "OK", note: lastCheck?.at ? ago(lastCheck.at) : "No checks recorded", href: "/tools", Icon: ShieldCheck },
  ];

  return <div className="axon-overview space-y-8">
    <section className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
      <div>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
          Workspace
          {lastCheck?.version && <span className="font-mono normal-case tracking-normal text-zinc-600">· Hub v{lastCheck.version}</span>}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-[38px]">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Your connected tools, AI runtimes and shared context in one place.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/integrations" className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"><Plug className="h-3.5 w-3.5"/> Add integration <ArrowUpRight className="h-3.5 w-3.5"/></Link>
        <Link href="/ai" className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/[.03] px-4 text-xs font-medium text-zinc-200 hover:bg-white/[.07]"><Bot className="h-3.5 w-3.5"/> Link AI account</Link>
      </div>
    </section>

    <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({label,value,note,href,Icon}) => <Link key={label} href={href} className="group min-h-[142px] bg-[#101012] p-5 transition hover:bg-[#151518]">
        <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">{label}</span><Icon className="h-4 w-4 text-zinc-600 transition group-hover:text-zinc-300"/></div>
        <div className="mt-5 flex items-end justify-between"><span className="font-mono text-[32px] font-medium tracking-tight text-zinc-100">{value}</span><ArrowUpRight className="mb-1 h-4 w-4 text-zinc-700 group-hover:text-zinc-300"/></div>
        <p className="mt-1 text-[11px] text-zinc-500">{note}</p>
      </Link>)}
    </section>

    {!complete && <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101012]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-zinc-100">Set up your workspace</h2><p className="mt-1 text-xs text-zinc-500">A few steps to get your Axon workspace ready.</p></div>
        <span className="font-mono text-[11px] text-zinc-500">{setup.filter(s=>s.done).length} / 3 complete</span>
      </div>
      <div className="divide-y divide-white/[.07]">
        {setup.map((s,i)=><div key={s.label} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
          <span className="w-7 font-mono text-[11px] text-zinc-600">0{i+1}</span>
          {s.done ? <CheckCircle2 className="h-4 w-4 text-emerald-400"/> : <span className="h-4 w-4 rounded-full border border-zinc-600"/>}
          <span className={`flex-1 text-sm ${s.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{s.label}</span>
          <Link href={s.href} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">{s.done ? "Review" : s.action}<ArrowRight className="h-3 w-3"/></Link>
        </div>)}
      </div>
    </section>}

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <div className="min-w-0 rounded-lg border border-white/10 bg-[#101012]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-zinc-500"/><h2 className="text-sm font-semibold text-zinc-100">Recent activity</h2></div><Link href="/activity" className="text-xs text-zinc-500 hover:text-white">View all <ArrowUpRight className="ml-1 inline h-3 w-3"/></Link></div>
        <div className="p-5"><ActivityLog token={token} limit={8}/></div>
      </div>
      <div className="rounded-lg border border-white/10 bg-[#101012]">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="text-sm font-semibold text-zinc-100">System status</h2><p className="mt-1 text-xs text-zinc-500">Latest recorded Hub health check</p></div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Health</span><span className={`inline-flex items-center gap-2 text-xs ${!lastCheck ? "text-zinc-500" : issues ? "text-amber-300" : "text-emerald-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${!lastCheck ? "bg-zinc-600" : issues ? "bg-amber-300" : "bg-emerald-400"}`}/>{!lastCheck ? "Not checked" : issues ? `${issues} issue(s)` : "Operational"}</span></div>
          <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Last check</span><span className="text-xs text-zinc-300">{lastCheck?.at ? ago(lastCheck.at) : "—"}</span></div>
          <div className="flex items-center justify-between"><span className="text-xs text-zinc-500">Hub version</span><span className="font-mono text-xs text-zinc-300">{lastCheck?.version || "—"}</span></div>
          <div className="border-t border-white/10 pt-4"><Link href="/tools" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">Open Hub tools <ArrowRight className="h-3 w-3"/></Link></div>
        </div>
      </div>
    </section>
  </div>;
}

import Link from "next/link";
import { Plug, Bot, FolderKanban, Activity, ArrowRight, Clock3, ChevronRight, Plus, Compass } from "lucide-react";
import { getAiApps, getProjects, getHubOverview } from "../../lib/data";
import { ago } from "../../lib/format";
import ActivityLog from "./ActivityLog";

export default async function Overview({ token, connected, name }: { token: string; connected: number; name: string }) {
  const [aiData, projectsData, hubData] = await Promise.all([
    getAiApps(token).catch(() => null), getProjects(token).catch(() => null), getHubOverview(token).catch(() => null),
  ]);
  const checks = (hubData?.hubs ?? []).flatMap(h => h.health ?? []).filter(c => c.at).sort((a,b) => String(b.at).localeCompare(String(a.at)));
  const lastCheck = checks[0];
  const issues = lastCheck?.anomalies?.length ?? 0;
  const accounts = aiData?.accounts ?? [];
  const projects = (projectsData?.accounts ?? []).flatMap(a => a.projects ?? []);
  const clientCount = accounts.reduce((n,a) => n + (a.clients?.length ?? 0), 0);
  const projectRows = projects.slice(0, 3);
  const metrics = [
    { label: "Projects", value: projects.length, Icon: FolderKanban, href: "/projects" },
    { label: "Integrations", value: connected, Icon: Plug, href: "/integrations" },
    { label: "AI Accounts", value: accounts.length, Icon: Bot, href: "/ai" },
  ];
  const healthLabel = !lastCheck ? "Status unavailable" : issues ? "Attention needed" : "All systems operational";
  return <div className="axon-overview space-y-5">
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.72fr)] lg:items-start">
      <div className="pt-2">
        <div className="mb-4 h-[2px] w-9 bg-[#9ca3af]" />
        <p className="text-[13px] text-zinc-400">Welcome back,</p>
        <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-.045em] text-white md:text-[38px]">{name}</h1>
        <p className="mt-2 max-w-[470px] text-[13px] leading-5 text-zinc-400">Your AI workspace is ready. Build, automate and collaborate with the power of Axon.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/projects" className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[11px] font-semibold text-black hover:bg-zinc-200">New Project <ArrowRight size={14}/></Link>
          <Link href="/integrations" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 text-[11px] text-zinc-200 hover:bg-white/[.08]">Explore Features</Link>
        </div>
      </div>
      <div className="flex min-h-[72px] items-center gap-3 rounded-xl border border-white/[.09] bg-[#101012] px-4 py-4 lg:mt-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${!lastCheck ? "bg-zinc-500" : issues ? "bg-amber-400" : "bg-emerald-400"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100">Axon {lastCheck && !issues ? "is operational" : "workspace status"}</p>
          <p className="mt-1 text-[10px] text-zinc-500">{healthLabel}{lastCheck?.at ? " · Checked " + ago(lastCheck.at) : ""}</p>
        </div>
        <Activity className="h-7 w-7 text-zinc-600"/>
      </div>
    </section>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({label,value,Icon,href}) => <Link key={label} href={href} className="group flex h-[62px] items-center gap-4 rounded-xl border border-white/[.08] bg-[#101012] px-4 hover:border-white/20 hover:bg-[#151518]">
        <Icon className="h-6 w-6 shrink-0 text-zinc-300"/>
        <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold leading-5 text-zinc-100">{value}</p><p className="text-[10px] text-zinc-500">{label}</p></div>
        <ChevronRight className="h-4 w-4 text-zinc-500"/>
      </Link>)}
      <Link href="/activity" className="group flex h-[62px] items-center gap-4 rounded-xl border border-white/[.08] bg-[#101012] px-4 hover:border-white/20 hover:bg-[#151518]">
        <Clock3 className="h-6 w-6 shrink-0 text-zinc-300"/>
        <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-zinc-100">Recent Activity</p><p className="text-[10px] text-zinc-500">Activity log</p></div>
        <ChevronRight className="h-4 w-4 text-zinc-500"/>
      </Link>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(270px,.8fr)]">
      <div className="min-w-0 rounded-xl border border-white/[.08] bg-[#101012]">
        <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3"><h2 className="text-[13px] font-semibold text-zinc-100">Your Projects</h2><Link href="/projects" className="text-[10px] text-zinc-400 hover:text-white">View all <ArrowRight className="ml-1 inline h-3 w-3"/></Link></div>
        {projectRows.length ? <div className="divide-y divide-white/[.06]">
          {projectRows.map((p:any,i:number) => <Link key={p.id ?? p.name ?? i} href="/projects" className="flex min-h-[58px] items-center gap-3 px-4 py-2 hover:bg-white/[.025]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#252529] text-[12px] font-semibold text-zinc-300">{String(p.name ?? "P").charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium text-zinc-100">{p.name ?? "Untitled project"}</span><span className="block truncate text-[10px] text-zinc-500">{p.description ?? "Project workspace"}</span></span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600"/>
          </Link>)}
        </div> : <div className="px-4 py-8 text-center"><p className="text-xs text-zinc-400">No projects yet</p><Link href="/projects" className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-200">Create your first project <Plus size={12}/></Link></div>}
      </div>
      <div className="rounded-xl border border-white/[.08] bg-[#101012]">
        <div className="border-b border-white/[.07] px-4 py-3"><h2 className="text-[13px] font-semibold text-zinc-100">Quick Actions</h2></div>
        <div className="p-2">
          {[
            {label:"Manage Integrations",href:"/integrations",Icon:Plug},
            {label:"Explore Tools",href:"/tools",Icon:Compass},
            {label:"View Activity",href:"/activity",Icon:Activity},
            {label:"AI Accounts",href:"/ai",Icon:Bot},
          ].map(({label,href,Icon})=><Link key={href} href={href} className="flex h-10 items-center gap-3 rounded-lg px-2 text-[11px] text-zinc-300 hover:bg-white/[.05] hover:text-white"><Icon className="h-[17px] w-[17px] text-zinc-400"/><span className="flex-1">{label}</span><ArrowRight className="h-3.5 w-3.5 text-zinc-500"/></Link>)}
        </div>
      </div>
    </section>
    <section className="rounded-xl border border-white/[.08] bg-[#101012]">
      <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3"><h2 className="text-[13px] font-semibold text-zinc-100">Recent Activity</h2><Link href="/activity" className="text-[10px] text-zinc-400 hover:text-white">View all <ArrowRight className="ml-1 inline h-3 w-3"/></Link></div>
      <div className="p-4"><ActivityLog token={token} limit={4}/></div>
    </section>
  </div>;
}

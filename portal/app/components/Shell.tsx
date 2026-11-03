"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import Logo from "./Logo";
import {
  LayoutDashboard, Puzzle, FolderKanban, Bot, Wrench, Activity, LifeBuoy,
  PanelLeftClose, PanelLeftOpen, Search, LifeBuoy,
} from "lucide-react";
import { NAV, NAV_GROUPS } from "../../lib/nav";
import { CommandPalette } from "./ui/CommandPalette";
import SignOutButton from "./SignOutButton";

export type Tab = "overview" | "integrations" | "projects" | "ai" | "tools" | "activity";

const ICONS: Record<string, typeof LayoutDashboard> = {
  overview: LayoutDashboard, integrations: Puzzle, projects: FolderKanban,
  ai: Bot, tools: Wrench, activity: Activity,
};

export default function Shell({ email, name, tab, title, sub, notice, children }: {
  email: string; name: string; tab: Tab; title: string; sub: string;
  notice: { kind: "error" | "ok"; text: string } | null; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [userMenuOpen]);

  const displayName = name || email;
  const initial = displayName.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("") || "?";
  const rail = collapsed ? "md:w-[72px]" : "md:w-[220px]";
  const offset = collapsed ? "md:pl-[72px]" : "md:pl-[220px]";

  return (
    <div className="axon-dashboard min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      <aside className={`axon-sidebar fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r border-white/10 bg-[#09090b] ${rail}`}>
        <div className="flex h-[64px] items-center border-b border-white/10 px-4">
          <Link href="/overview" title="Axon workspace" className="flex min-w-0 items-center gap-3">
            <Logo size={30} className="shrink-0" />
            {!collapsed && <span className="min-w-0"><span className="block text-[15px] font-semibold tracking-tight text-white">Axon</span><span className="block truncate text-[11px] text-zinc-500">Workspace</span></span>}
          </Link>
          {!collapsed && <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-zinc-500">BETA</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {NAV_GROUPS.map((group, gi) => {
            const items = NAV.filter((n) => n.group === group);
            return <section key={group} className={gi ? "mt-7" : ""}>
              {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">{group === "AI" ? "AI tools" : group}</p>}
              <nav className="space-y-1">
                {items.map((item) => {
                  const Icon = ICONS[item.id] || LayoutDashboard;
                  const active = tab === item.id;
                  return <Link key={item.id} href={item.href} title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${active ? "bg-white/[.10] text-white ring-1 ring-inset ring-white/[.08]" : "text-zinc-400 hover:bg-white/[.05] hover:text-zinc-100"}`}>
                    <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-zinc-300" />}
                  </Link>;
                })}
              </nav>
            </section>;
          })}
        </div>

        <div className="border-t border-white/10 p-3">
          {!collapsed && <Link href="/support" className="mb-2 flex h-9 items-center gap-3 rounded-lg px-3 text-[12px] text-zinc-400 hover:bg-white/[.05] hover:text-zinc-100"><LifeBuoy className="h-4 w-4" />Help &amp; Support</Link>}
          <button type="button" onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-xs text-zinc-500 hover:bg-white/[.05] hover:text-zinc-200 ${collapsed ? "justify-center px-0" : ""}`}>
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && "Collapse sidebar"}
          </button>
          {!collapsed && <div className="mt-3 flex items-center gap-2 border-t border-white/[.07] px-2 pt-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-[11px] font-semibold text-zinc-100">{initial}</span>
            <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{displayName}</span>
          </div>}
        </div>
      </aside>

      <div className={`min-h-screen min-w-0 ${offset}`}>
        <header className="axon-topbar sticky top-0 z-40 flex h-[64px] items-center gap-4 border-b border-white/10 bg-[#09090b]/95 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden"><Logo size={29}/><span className="text-sm font-semibold">Axon</span></div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-[13px] font-medium text-zinc-100">{title}</p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">{sub}</p>
          </div>
          <div className="flex-1" />
          <button type="button" onClick={() => setCmdOpen(true)} className="hidden h-9 w-full max-w-[420px] items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 text-xs text-zinc-500 hover:border-white/20 hover:text-zinc-200 sm:flex">
            <Search className="h-3.5 w-3.5"/> Search workspace <kbd className="ml-5 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">⌘ K</kbd>
          </button>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setUserMenuOpen(v => !v)} aria-expanded={userMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700">{initial}</button>
            {userMenuOpen && <div className="absolute right-0 mt-2 w-60 rounded-lg border border-white/10 bg-[#151518] p-2 shadow-2xl">
              <div className="px-2 py-2"><p className="truncate text-xs font-medium text-zinc-100">{displayName}</p><p className="mt-1 truncate text-[11px] text-zinc-500">{email}</p></div><div className="my-1 border-t border-white/10"/><SignOutButton />
            </div>}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-5 md:px-7 md:pb-12 md:pt-5">
          {notice && <div role="status" className={`mb-6 rounded-md border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-blue-400/20 bg-blue-400/[.07] text-blue-200" : "border-red-400/20 bg-red-400/[.07] text-red-200"}`}>{notice.text}</div>}
          {children}
        </main>
      </div>

      <nav className="axon-mobile-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-white/10 bg-[#09090b]/95 px-1 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 backdrop-blur-xl md:hidden">
        {NAV.map(item => {
          const Icon = ICONS[item.id] || LayoutDashboard;
          const active = tab === item.id;
          return <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-md py-2 text-[9px] ${active ? "text-white" : "text-zinc-500"}`}>
            <Icon className="h-[17px] w-[17px]"/><span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
          </Link>;
        })}
      </nav>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen}/>
    </div>
  );
}

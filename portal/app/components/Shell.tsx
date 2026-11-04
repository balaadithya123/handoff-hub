"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import Logo from "./Logo";
import {
  LayoutDashboard, Puzzle, FolderKanban, Bot, Wrench, Activity, LifeBuoy,
  PanelLeftClose, PanelLeftOpen, Search,
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
  const rail = collapsed ? "md:w-[76px]" : "md:w-[260px]";
  const offset = collapsed ? "md:pl-[76px]" : "md:pl-[260px]";

  return (
    <div className="axon-dashboard min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      <aside className={`axon-sidebar fixed inset-y-0 left-0 z-50 hidden md:flex flex-col ${rail}`}>
        <div className="axon-sidebar-brand">
          <Link href="/overview" title="Axon workspace" className="axon-brand-link">
            <span className="axon-brand-symbol"><Logo size={29} /></span>
            {!collapsed && <span className="axon-brand-copy"><strong>AXON</strong><small>WORKSPACE</small></span>}
          </Link>
          {!collapsed && <span className="axon-brand-beta">BETA</span>}
        </div>
        <div className="axon-sidebar-scroll">
          {NAV_GROUPS.map((group) => {
            const items = NAV.filter(item => item.group === group);
            return <section key={group} className="axon-nav-group">
              {!collapsed && <p className="axon-nav-caption">{group === "AI" ? "AI TOOLS" : group === "Monitor" ? "MONITORING" : "WORKSPACE"}</p>}
              <nav className="axon-nav-list">
                {items.map(item => {
                  const Icon = ICONS[item.id] || LayoutDashboard;
                  const active = tab === item.id;
                  return <Link key={item.id} href={item.href} title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`axon-nav-item ${active ? "is-active" : ""} ${collapsed ? "is-collapsed" : ""}`}>
                    <span className="axon-nav-icon"><Icon size={17} strokeWidth={1.8}/></span>
                    {!collapsed && <><span className="axon-nav-label">{item.label}</span>{active && <span className="axon-nav-active-dot"/>}</>}
                  </Link>;
                })}
              </nav>
            </section>;
          })}
        </div>
        <div className="axon-sidebar-bottom">
          {!collapsed && <Link href="/support" className="axon-support-link"><LifeBuoy size={16}/>Help &amp; Support<span>↗</span></Link>}
          <button type="button" className={`axon-collapse-button ${collapsed ? "is-collapsed" : ""}`} onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={17}/> : <><PanelLeftClose size={17}/>Collapse sidebar</>}
          </button>
          <div className={`axon-sidebar-profile ${collapsed ? "is-collapsed" : ""}`}>
            <span className="axon-profile-avatar">{initial}</span>
            {!collapsed && <span className="axon-profile-copy"><strong>{displayName}</strong><small>{email}</small></span>}
          </div>
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

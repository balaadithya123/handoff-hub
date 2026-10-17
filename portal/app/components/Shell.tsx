"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import Logo from "./Logo";
import {
  LayoutDashboard, Plug, FolderKanban, Bot, Wrench, Activity,
  PanelLeftClose, PanelLeftOpen, Search, ChevronsUpDown,
} from "lucide-react";
import { NAV, NAV_GROUPS } from "../../lib/nav";
import { CommandPalette } from "./ui/CommandPalette";
import SignOutButton from "./SignOutButton";

export type Tab = "overview" | "integrations" | "projects" | "ai" | "tools" | "activity";

const ICONS: Record<string, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  integrations: Plug,
  projects: FolderKanban,
  ai: Bot,
  tools: Wrench,
  activity: Activity,
};

export default function Shell({
  email, tab, title, sub, notice, children,
}: {
  email: string;
  tab: Tab;
  title: string;
  sub: string;
  notice: { kind: "error" | "ok"; text: string } | null;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const initial = (email || "?").charAt(0).toUpperCase();
  const railW = collapsed ? "md:w-14" : "md:w-64";
  const padL = collapsed ? "md:pl-14" : "md:pl-64";

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#141414] font-sans antialiased flex flex-col">
      <aside className={`fixed left-0 top-0 h-full bg-[#f6f5f2] border-r border-[#e7e4dc] z-50 hidden md:flex flex-col justify-between select-none transition-[width] duration-200 ${railW}`}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-16 px-3 flex items-center border-b border-[#e7e4dc]">
            <Link href="/overview" title="Axon" className="flex items-center gap-2.5 w-full p-2 rounded-lg bg-white/80 hover:bg-white border border-[#e7e4dc] hover:border-[#d9d5cb] transition-all group text-left">
              <Logo size={30} className="shrink-0" />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-[#141414] truncate">Axon</span>
                      <span className="px-1.5 rounded font-mono text-[10px] bg-[#efeee9] text-[#6f6e68] border border-[#e7e4dc] leading-4">PORTAL</span>
                    </div>
                    <span className="block font-mono text-[11px] text-[#9a988f] truncate">{email}</span>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#9a988f] group-hover:text-[#141414] transition-colors" />
                </>
              )}
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-1">
            {NAV_GROUPS.map((group, gi) => {
              const items = NAV.filter((n) => n.group === group);
              return (
                <div key={group} className={gi === 0 ? "" : "pt-4"}>
                  {!collapsed && (
                    <div className="px-3 pt-2 pb-1.5 font-mono text-[10px] text-[#9a988f] uppercase tracking-wider font-semibold">
                      {group === "AI" ? "AI Engine" : group}
                    </div>
                  )}
                  <nav className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const Icon = ICONS[item.id] || LayoutDashboard;
                      const isActive = tab === item.id;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                            collapsed ? "justify-center" : ""
                          } ${
                            isActive
                              ? "bg-[#141414] text-[#f6f5f2]"
                              : "text-[#6f6e68] hover:bg-[#efeee9] hover:text-[#141414]"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-2 border-t border-[#e7e4dc] space-y-1">
          <button
            type="button"
            title={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#6f6e68] hover:bg-[#efeee9] hover:text-[#141414]"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${padL}`}>
        <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 md:px-6 border-b border-[#e7e4dc] bg-[#f6f5f2]/90 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <Logo size={28} />
            <span className="text-sm font-medium">Axon</span>
          </div>
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-[#141414] font-medium truncate">{title}</span>
            {sub ? <span className="text-[#9a988f] text-sm truncate hidden lg:inline">{sub}</span> : null}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-full border border-[#e7e4dc] bg-white px-3 py-1.5 text-xs text-[#6f6e68] hover:border-[#d9d5cb]"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-full bg-[#141414] text-sm font-medium text-[#f6f5f2]"
            >
              {initial}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e7e4dc] bg-white p-2 shadow-lg z-50">
                <p className="px-2 py-1.5 text-xs text-[#9a988f] truncate">{email}</p>
                <SignOutButton />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
          {notice && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                notice.kind === "ok"
                  ? "border-[rgba(47,111,224,0.28)] bg-[#e8f0fc] text-[#2f6fe0]"
                  : "border-[rgba(204,68,68,0.28)] bg-[rgba(204,68,68,0.08)] text-[#c44]"
              }`}
            >
              {notice.text}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-[#e7e4dc] bg-[#f6f5f2]/95 backdrop-blur px-1 py-1">
        {NAV.map((item) => {
          const Icon = ICONS[item.id] || LayoutDashboard;
          const isActive = tab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] ${
                isActive ? "text-[#141414] font-medium" : "text-[#9a988f]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}

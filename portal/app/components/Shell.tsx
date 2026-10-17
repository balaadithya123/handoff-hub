"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import Logo from "./Logo";
import {
  LayoutDashboard,
  Plug,
  FolderKanban,
  Bot,
  Wrench,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronsUpDown,
  BookOpen,
} from "lucide-react";
import { NAV, NAV_GROUPS, hrefForTab } from "../../lib/nav";
import { CommandPalette } from "./ui/CommandPalette";
import SignOutButton from "./SignOutButton";

export type Tab = "overview" | "integrations" | "projects" | "ai" | "tools" | "activity";

export default function Shell({
  email,
  tab,
  title,
  sub,
  notice,
  children,
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const initial = (email || "?").charAt(0).toUpperCase();

  const getIcon = (id: string) => {
    switch (id) {
      case "overview":
        return LayoutDashboard;
      case "integrations":
        return Plug;
      case "projects":
        return FolderKanban;
      case "ai":
        return Bot;
      case "tools":
        return Wrench;
      case "activity":
        return Activity;
      default:
        return LayoutDashboard;
    }
  };

  const railW = collapsed ? "md:w-14" : "md:w-64";
  const padL = collapsed ? "md:pl-14" : "md:pl-64";
  const left = collapsed ? "md:left-14" : "md:left-64";
  const live = (id: string) => id === "ai";

  return (
    <div className="min-h-screen bg-[#090909] text-[#f5f5f5] font-sans antialiased flex flex-col">
      <aside
        className={`fixed left-0 top-0 h-full bg-[#111] border-r border-white/[0.08] z-50 hidden md:flex flex-col justify-between select-none transition-[width] duration-200 ${railW}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-16 px-3 flex items-center border-b border-white/[0.08]">
            <Link
              href="/overview"
              title="Handoff Hub"
              className="flex items-center gap-2.5 w-full p-2 rounded-lg bg-[#161616]/60 hover:bg-[#161616] border border-white/[0.08] hover:border-white/[0.14] transition-all group text-left"
            >
              <Logo size={30} className="shrink-0" />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-[#f5f5f5] truncate">
                        Handoff Hub
                      </span>
                      <span className="px-1.5 rounded font-mono text-[10px] bg-white/[0.06] text-[#a3a3a3] border border-white/[0.1] leading-4">
                        PORTAL
                      </span>
                    </div>
                    <span className="block font-mono text-[11px] text-[#737373] truncate">{email}</span>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#f5f5f5] transition-colors" />
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
                    <div className="px-3 pt-2 pb-1.5 font-mono text-[10px] text-[#737373] uppercase tracking-wider font-semibold">
                      {group === "AI" ? "AI Engine" : group}
                    </div>
                  )}
                  <nav className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const IconComponent = getIcon(item.id);
                      const isActive = tab === item.id;
                      return (
                        <Link
                          key={item.id}
                          href={hrefForTab(item.id)}
                          title={collapsed ? item.label : undefined}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                            isActive
                              ? "bg-[#161616] text-[#f5f5f5] border-l-2 border-white"
                              : "text-[#a3a3a3] border-l-2 border-transparent hover:bg-[#161616] hover:text-[#f5f5f5]"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-[#f5f5f5]" : "text-[#737373] group-hover:text-[#f5f5f5]"
                              }`}
                            />
                            {!collapsed && <span>{item.label}</span>}
                          </span>
                          {!collapsed && live(item.id) && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6b9eff]" />
                              <span className="font-mono text-[10px] text-[#93b4ff]">Live</span>
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-white/[0.08] flex flex-col gap-2.5">
          {!collapsed && (
            <>
              <div className="p-2.5 rounded-lg bg-[#161616] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6b9eff]" />
                    <span className="font-mono text-[10px] text-[#f5f5f5] font-medium">Hub</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#a3a3a3]">v0.20</span>
                </div>
                <div className="flex items-center justify-between text-[#737373] font-mono text-[10px]">
                  <span>Session</span>
                  <span className="text-[#a3a3a3]">Signed in</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-1 text-[#737373] font-mono text-[11px]">
                <Link href="/support" className="hover:text-[#f5f5f5] transition-colors flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Docs & Support</span>
                </Link>
                <kbd className="px-1.5 py-0.5 rounded bg-[#1c1c1c] border border-white/[0.08] text-[#a3a3a3]">⌘K</kbd>
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5">
                <div className="w-7 h-7 rounded-full bg-white/[0.08] text-[#f5f5f5] border border-white/[0.12] flex items-center justify-center font-bold text-xs shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-medium text-[#f5f5f5] truncate">{email.split("@")[0]}</span>
                  <span className="block font-mono text-[10px] text-[#737373] truncate">{email}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand rail" : "Collapse rail"}
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616] border border-transparent hover:border-white/[0.08] transition-all"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      <header
        className={`fixed top-0 right-0 left-0 ${left} h-16 bg-[#090909]/90 backdrop-blur-xl border-b border-white/[0.08] z-40 px-4 md:px-8 flex items-center justify-between gap-4 transition-[left] duration-200`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/overview" className="md:hidden flex items-center gap-2 shrink-0">
            <Logo size={30} />
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] text-[#737373] overflow-hidden">
            <span className="hidden sm:inline">Handoff Hub</span>
            <span className="hidden sm:inline text-white/20">/</span>
            <span className="text-[#f5f5f5] font-medium truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setCmdOpen(true)}
            className="relative flex items-center h-9 pl-9 pr-12 w-10 sm:w-64 rounded-lg bg-[#111] border border-white/[0.08] hover:border-white/[0.14] text-[13px] text-[#737373] transition-colors text-left"
            aria-label="Search or jump to"
          >
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#737373]" />
            <span className="hidden sm:inline truncate">Search or jump to...</span>
            <kbd className="hidden sm:inline absolute right-2 font-mono text-[11px] text-[#737373] bg-[#1c1c1c] px-1.5 py-0.5 rounded border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111] border border-white/[0.08] font-mono text-[11px] text-[#93b4ff]">
            <span className="w-2 h-2 rounded-full bg-[#6b9eff]" />
            <span>Hub online</span>
          </div>

          <Link
            href="/activity"
            aria-label="Activity"
            className="relative p-2 rounded-lg text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#161616] border border-white/[0.08] transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>

          <Link
            href="/?tab=integrations"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#1c1c1c] border border-white/[0.08] hover:border-white/[0.14] text-[#f5f5f5] text-[13px] font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#161616] transition-colors border border-white/[0.08]"
            >
              <div className="text-right hidden md:block leading-tight">
                <span className="block text-[11px] font-medium text-[#f5f5f5] max-w-[140px] truncate">{email}</span>
                <span className="block font-mono text-[10px] text-[#737373]">Owner</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/[0.08] text-[#f5f5f5] border border-white/[0.12] flex items-center justify-center font-bold text-xs">
                {initial}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#737373] md:hidden" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111] border border-white/[0.12] shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[#737373]">Signed in as</span>
                  <span className="block text-xs font-medium text-[#f5f5f5] truncate">{email}</span>
                </div>
                <div className="pt-1">
                  <SignOutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`dash-main flex-1 pt-16 transition-[padding] duration-200 ${padL} pb-24 md:pb-8`}>
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
          {notice && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                notice.kind === "error"
                  ? "bg-[rgba(224,112,112,0.1)] border-[rgba(224,112,112,0.28)] text-[#e07070]"
                  : "bg-[rgba(107,158,255,0.12)] border-[rgba(107,158,255,0.28)] text-[#93b4ff]"
              }`}
            >
              {notice.text}
            </div>
          )}
          {children}
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 min-h-14 pb-[env(safe-area-inset-bottom)] bg-[#111]/95 backdrop-blur-lg border-t border-white/[0.08] z-40 flex items-center justify-around md:hidden px-2"
      >
        {NAV.map((item) => {
          const IconComponent = getIcon(item.id);
          const isActive = tab === item.id;
          return (
            <Link
              key={item.id}
              href={hrefForTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center px-1.5 py-1.5 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#f5f5f5]" : "text-[#737373] hover:text-[#f5f5f5]"
              }`}
            >
              {isActive && <span className="absolute -top-px left-2 right-2 h-px bg-white" />}
              <IconComponent className="w-4 h-4" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}

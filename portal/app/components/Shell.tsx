"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
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
  LogOut,
  ChevronDown,
  Sparkles,
  ChevronsUpDown,
  BookOpen,
} from "lucide-react";
import { NAV, NAV_GROUPS, NavItem, hrefForTab } from "../../lib/nav";
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("handoff_rail_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapsed = (nextState: boolean) => {
    setCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("handoff_rail_collapsed", String(nextState));
    }
  };

  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased flex flex-col">
      {/* Left rail (desktop), full height like the Stitch design */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#0a0a0a] border-r border-white/[0.08] z-50 hidden md:flex flex-col justify-between select-none transition-[width] duration-200 ${railW}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Workspace switcher */}
          <div className="h-16 px-3 flex items-center border-b border-white/[0.08]">
            <Link
              href="/overview"
              title="Handoff Hub"
              className="flex items-center gap-2.5 w-full p-2 rounded-lg bg-[#121212]/60 hover:bg-[#121212] border border-white/[0.08] hover:border-white/[0.16] transition-all group text-left"
            >
              <div className="w-7 h-7 rounded-md bg-[#2a2a2a] border border-white/[0.08] flex items-center justify-center text-[#60eca8] font-semibold text-sm shrink-0">
                H
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-[#e5e2e1] truncate group-hover:text-[#60eca8] transition-colors">
                        Handoff Hub
                      </span>
                      <span className="px-1.5 rounded font-mono text-[10px] bg-[#60eca8]/10 text-[#60eca8] border border-[#60eca8]/20 leading-4">
                        PORTAL
                      </span>
                    </div>
                    <span className="block font-mono text-[11px] text-[#707070] truncate">{email}</span>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#707070] group-hover:text-[#e5e2e1] transition-colors" />
                </>
              )}
            </Link>
          </div>

          {/* Nav groups */}
          <div className="flex-1 overflow-y-auto py-2 px-1">
            {NAV_GROUPS.map((group, gi) => {
              const items = NAV.filter((n) => n.group === group);
              return (
                <div key={group} className={gi === 0 ? "" : "pt-4"}>
                  {!collapsed && (
                    <div className="px-3 pt-2 pb-1.5 font-mono text-[10px] text-[#707070] uppercase tracking-wider font-semibold">
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
                              ? "bg-[#121212] text-[#60eca8] border-l-2 border-[#60eca8]"
                              : "text-[#bbcabe] border-l-2 border-transparent hover:bg-[#121212] hover:text-[#e5e2e1]"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-[#60eca8]" : "text-[#707070] group-hover:text-[#60eca8]"
                              }`}
                            />
                            {!collapsed && <span>{item.label}</span>}
                          </span>
                          {!collapsed && live(item.id) && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#60eca8] animate-pulse" />
                              <span className="font-mono text-[10px] text-[#60eca8]">Live</span>
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

        {/* Rail footer */}
        <div className="p-3 border-t border-white/[0.08] flex flex-col gap-2.5 bg-[#0e0e0e]/40">
          {!collapsed && (
            <>
              <div className="p-2.5 rounded-lg bg-[#121212] border border-white/[0.08] hover:border-white/[0.16] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#60eca8]" />
                    <span className="font-mono text-[10px] text-[#e5e2e1] font-medium">Hub</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#60eca8]">v0.20</span>
                </div>
                <div className="flex items-center justify-between text-[#707070] font-mono text-[10px]">
                  <span>Session</span>
                  <span className="text-[#bbcabe]">Signed in</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-1 text-[#707070] font-mono text-[11px]">
                <Link href="/support" className="hover:text-[#e5e2e1] transition-colors flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Docs &amp; Support</span>
                </Link>
                <kbd className="px-1.5 py-0.5 rounded bg-[#201f1f] border border-white/[0.08] text-[#a1a1a1]">⌘K</kbd>
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5">
                <div className="w-7 h-7 rounded-full bg-[#60eca8]/15 text-[#60eca8] border border-[#60eca8]/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {initial}
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-medium text-[#e5e2e1] truncate">{email.split("@")[0]}</span>
                  <span className="block font-mono text-[10px] text-[#707070] truncate">{email}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => toggleCollapsed(!collapsed)}
              title={collapsed ? "Expand rail" : "Collapse rail"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#707070] hover:text-[#e5e2e1] hover:bg-[#121212] border border-transparent hover:border-white/[0.08] transition-all"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar, offset by the rail */}
      <header
        className={`fixed top-0 right-0 left-0 ${left} h-16 bg-black/80 backdrop-blur-xl border-b border-white/[0.08] z-40 px-4 md:px-8 flex items-center justify-between gap-4 transition-[left] duration-200`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/overview" className="md:hidden flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-[#2a2a2a] border border-white/[0.08] flex items-center justify-center text-[#60eca8] font-semibold text-sm">
              H
            </div>
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] text-[#707070] overflow-hidden">
            <span className="hidden sm:inline">Handoff Hub</span>
            <span className="hidden sm:inline text-white/20">/</span>
            <span className="text-[#e5e2e1] font-medium truncate">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setCmdOpen(true)}
            className="relative flex items-center h-9 pl-9 pr-12 w-10 sm:w-64 rounded-lg bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] text-[13px] text-[#707070] transition-colors text-left"
            aria-label="Search or jump to"
          >
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#707070]" />
            <span className="hidden sm:inline truncate">Search or jump to...</span>
            <kbd className="hidden sm:inline absolute right-2 font-mono text-[11px] text-[#707070] bg-[#201f1f] px-1.5 py-0.5 rounded border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-white/[0.08] font-mono text-[11px] text-[#60eca8]">
            <span className="w-2 h-2 rounded-full bg-[#60eca8] animate-pulse" />
            <span>Hub online</span>
          </div>

          <Link
            href="/activity"
            aria-label="Activity"
            className="relative p-2 rounded-lg text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#121212] border border-white/[0.08] transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>

          <Link
            href="/integrations"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#201f1f] border border-white/[0.08] hover:border-white/[0.16] text-[#e5e2e1] text-[13px] font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#60eca8]" />
            <span>Connect</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#121212] transition-colors border border-white/[0.08]"
            >
              <div className="text-right hidden md:block leading-tight">
                <span className="block text-[11px] font-medium text-[#e5e2e1] max-w-[140px] truncate">{email}</span>
                <span className="block font-mono text-[10px] text-[#707070]">Owner</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#60eca8]/15 text-[#60eca8] border border-[#60eca8]/30 flex items-center justify-center font-bold text-xs">
                {initial}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#707070] md:hidden" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0a0a0a] border border-white/[0.16] shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[#707070]">Signed in as</span>
                  <span className="block text-xs font-medium text-[#ededed] truncate">{email}</span>
                </div>
                <div className="pt-1">
                  <SignOutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`dash-main flex-1 pt-16 transition-[padding] duration-200 ${padL} pb-20 md:pb-8`}>
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
          {notice && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                notice.kind === "error"
                  ? "bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]"
                  : "bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#5be3a6]"
              }`}
            >
              {notice.text}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/10 z-40 flex items-center justify-around md:hidden px-2">
        {NAV.map((item) => {
          const IconComponent = getIcon(item.id);
          const isActive = tab === item.id;
          return (
            <Link
              key={item.id}
              href={hrefForTab(item.id)}
              className={`flex flex-col items-center justify-center p-1 gap-0.5 text-[10px] font-medium ${
                isActive ? "text-[#3ecf8e]" : "text-[#8a8a8a]"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Command Palette Modal */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}

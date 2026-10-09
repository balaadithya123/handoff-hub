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
  const [collapsed, setCollapsed] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased flex flex-col">
      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/overview" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white to-neutral-400 text-black flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
              H
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline-block text-[#ededed]">
              Handoff Hub
            </span>
          </Link>

          <span className="text-white/20 hidden sm:inline-block">/</span>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#a1a1a1] overflow-hidden truncate">
            <span className="text-[#8a8a8a] hidden md:inline-block">Acme Systems</span>
            <span className="text-white/20 hidden md:inline-block">/</span>
            <span className="text-[#ededed] font-medium truncate">{title}</span>
          </div>
        </div>

        {/* Top bar right actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cmd+K trigger input */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 h-8 pl-3 pr-2.5 rounded-lg bg-[#111111] border border-white/10 hover:border-white/20 text-xs text-[#8a8a8a] transition-colors w-36 sm:w-56 justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0 text-[#8a8a8a]" />
              <span className="truncate">Search or jump...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-[#8a8a8a]">
              ⌘K
            </kbd>
          </button>

          {/* Operational Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[11px] font-mono text-[#3ecf8e]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3ecf8e]"></span>
            </span>
            <span>All systems live</span>
          </div>

          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="relative p-1.5 rounded-lg text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/5 border border-white/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg bg-[#111111] hover:bg-[#181818] border border-white/10 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/30 flex items-center justify-center font-bold text-xs">
                {initial}
              </div>
              <span className="text-xs text-[#ededed] font-medium hidden md:inline-block max-w-[120px] truncate">
                {email}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a8a8a]" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0a0a0a] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                    Signed in as
                  </span>
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

      <div className="flex pt-14 flex-1">
        {/* Left Collapsible Rail (Desktop) */}
        <aside
          className={`fixed left-0 top-14 bottom-0 bg-[#0a0a0a] border-r border-white/10 z-30 transition-all duration-200 hidden md:flex flex-col justify-between ${
            collapsed ? "w-14" : "w-60"
          }`}
        >
          <div className="p-3 space-y-6 overflow-y-auto">
            {NAV_GROUPS.map((group) => {
              const items = NAV.filter((n) => n.group === group);
              return (
                <div key={group} className="space-y-1">
                  {!collapsed && (
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a]">
                      {group}
                    </div>
                  )}
                  {items.map((item) => {
                    const IconComponent = getIcon(item.id);
                    const isActive = tab === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={hrefForTab(item.id)}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-white/10 text-[#ededed] border-l-2 border-[#3ecf8e]"
                            : "text-[#a1a1a1] hover:text-[#ededed] hover:bg-white/5"
                        }`}
                      >
                        <IconComponent
                          className={`w-4 h-4 shrink-0 ${isActive ? "text-[#3ecf8e]" : "text-[#8a8a8a]"}`}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Rail Collapse Toggle Footer */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a8a8a]">
                <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" />
                <span>Handoff v0.20</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand rail" : "Collapse rail"}
              className="p-1.5 rounded-lg text-[#8a8a8a] hover:text-[#ededed] hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className={`flex-1 transition-all duration-200 ${collapsed ? "md:pl-14" : "md:pl-60"} pb-16 md:pb-8`}>
          <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            {notice && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                  notice.kind === "error"
                    ? "bg-[#ff7b7b]/10 border-[#ff7b7b]/30 text-[#ff7b7b]"
                    : "bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#5be3a6]"
                }`}
              >
                <span>{notice.text}</span>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

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

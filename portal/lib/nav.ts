import { Activity, Bot, FolderKanban, LayoutDashboard, Plug, Wrench, type LucideIcon } from "lucide-react";

export type NavId = "overview" | "integrations" | "projects" | "ai" | "tools" | "activity";
export type NavGroup = "Workspace" | "AI" | "Monitor";

export type NavItem = {
  id: NavId;
  label: string;
  href: string;
  group: NavGroup;
  icon: LucideIcon;
  hint: string;
};

export const NAV: NavItem[] = [
  { id: "overview", label: "Overview", href: "/overview", group: "Workspace", icon: LayoutDashboard, hint: "home dashboard summary" },
  { id: "integrations", label: "Integrations", href: "/integrations", group: "Workspace", icon: Plug, hint: "connect apps" },
  { id: "projects", label: "Projects", href: "/projects", group: "Workspace", icon: FolderKanban, hint: "memory pools" },
  { id: "ai", label: "AI accounts", href: "/ai", group: "AI", icon: Bot, hint: "claude chatgpt link" },
  { id: "tools", label: "Hub tools", href: "/tools", group: "AI", icon: Wrench, hint: "claims approvals allowlist health brief" },
  { id: "activity", label: "Activity", href: "/activity", group: "Monitor", icon: Activity, hint: "timeline log events" },
];

export const NAV_GROUPS: NavGroup[] = ["Workspace", "AI", "Monitor"];

const BY_ID = new Map<string, NavItem>(NAV.map((n) => [n.id, n]));

/** Maps the old `/?tab=` value to a route, so existing links and redirects keep working. */
export function hrefForTab(tab: string | undefined): string {
  return BY_ID.get(tab ?? "")?.href ?? "/overview";
}

export function navForPath(pathname: string): NavItem | undefined {
  return NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
}

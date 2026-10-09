import { rpc } from "./portal";
import { connectionStatus } from "./connections";

/* Typed loaders around the existing Supabase RPCs. Names and arguments are unchanged. */

// ---- AI accounts (portal_ai_apps) ----
export type AiClient = { client_id?: string; name: string; nickname?: string | null; last_active: string; connected_at?: string | null };
export type AiAccount = { id: string; label: string; nickname?: string | null; linked_at: string; clients: AiClient[] };
export type AiApps = { ok?: boolean; linked?: boolean; needs_unlock?: boolean; accounts?: AiAccount[] } | null;

export async function getAiApps(token: string): Promise<AiApps> {
  try {
    return await rpc<AiApps>("portal_ai_apps", { p_token: token });
  } catch {
    return null;
  }
}

// ---- Activity (portal_hub_events) ----
export type HubEvent = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };

export async function getEvents(token: string, limit = 30, project = ""): Promise<{ rows: HubEvent[]; failed: boolean }> {
  try {
    const rows = (await rpc<HubEvent[] | null>("portal_hub_events", { p_token: token, p_limit: limit, p_project: project || null })) ?? [];
    return { rows, failed: false };
  } catch {
    return { rows: [], failed: true };
  }
}

// ---- Projects (portal_projects) ----
export type ProjectRecent = { at?: string | null; agent?: string | null; action?: string | null; text?: string | null };
export type ProjectCounts = { memories: number; events: number; tasks: number; pending_tasks: number; blockers: number; claims: number };
export type Project = { id: string; name: string; description?: string | null; updated_at?: string | null; is_portal: boolean; summary?: string | null; counts: ProjectCounts; recent: ProjectRecent[] };
export type ProjectAccount = { id: string; label: string; nickname: string | null; ops_project: string; projects: Project[] };
export type ProjectsRes = { ok?: boolean; accounts?: ProjectAccount[] } | null;

export async function getProjects(token: string): Promise<ProjectsRes> {
  try {
    return await rpc<ProjectsRes>("portal_projects", { p_token: token });
  } catch {
    return null;
  }
}

// ---- Hub tools (portal_hub_overview) ----
export type HubTask = { id?: string; from?: string; to?: string; status?: string; at?: string; task?: string };
export type HubHealth = { at?: string; agent?: string; anomalies?: unknown[]; version?: string | null; tools?: string | null; deploy?: string | null };
export type Hub = {
  hub_user_id: string;
  nickname: string | null;
  allowlist: { github: string[]; vercel: string[] };
  summary?: unknown;
  decisions: unknown[];
  blockers: unknown[];
  claims: Record<string, unknown>;
  approvals: unknown[];
  tasks: HubTask[];
  health: HubHealth[];
};
export type HubOverview = { ok?: boolean; hubs?: Hub[] } | null;

export async function getHubOverview(token: string): Promise<HubOverview> {
  try {
    return await rpc<HubOverview>("portal_hub_overview", { p_token: token });
  } catch {
    return null;
  }
}

// ---- Integrations (Hub /api/provider-oauth status) ----
export async function getConnections(token: string) {
  return connectionStatus(token).catch(() => []);
}

// ---- Small shared helpers ----
export const asText = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));
export const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
export const asArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

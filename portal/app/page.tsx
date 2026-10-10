import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../lib/portal";
import { connectionStatus } from "../lib/connections";
import Shell, { type Tab } from "./components/Shell";
import ConnectorDirectory from "./components/ConnectorDirectory";
import Landing from "./components/Landing";
import AiAccounts from "./components/AiAccounts";
import ActivityLog from "./components/ActivityLog";
import Overview from "./components/Overview";
import HubTools from "./components/HubTools";
import Projects from "./components/Projects";
import { hrefForTab } from "../lib/nav";

export const dynamic = "force-dynamic";

type Notice = { kind: "error" | "ok"; text: string } | null;

const META: Record<Tab, [string, string]> = {
  overview: ["Overview", "Your Handoff Hub account at a glance."],
  integrations: ["Integrations", "Connect your tools with their own sign-in. Handoff Hub never sees your passwords."],
  projects: ["Projects & Pools", "Separate memory pools your AI apps can save to."],
  ai: ["AI Accounts", "Link the AI accounts that use your connections."],
  tools: ["Hub Tools & Controls", "Allowlist, workload, claims, approvals, health checks and context brief."],
  activity: ["Activity & Telemetry", "What your AI accounts did through the Hub, across all projects."],
};

async function Dashboard({
  email,
  token,
  tab,
  notice,
  project,
}: {
  email: string;
  token: string;
  tab: Tab;
  notice: Notice;
  project: string;
}) {
  const connections = await connectionStatus(token).catch(() => []);
  const names: Record<string, string> = {};
  const expiredMap: Record<string, boolean> = {};
  const now = Date.now();
  for (const c of connections) {
    if (c.provider_account_name) names[c.provider] = c.provider_account_name;
    if (c.expires_at && new Date(c.expires_at).getTime() < now) {
      expiredMap[c.provider] = true;
    }
  }
  const [title, sub] = META[tab];

  return (
    <Shell email={email} tab={tab} title={title} sub={sub} notice={notice}>
      {tab === "integrations" ? (
        <ConnectorDirectory connected={connections.map((c) => c.provider as string)} names={names} expiredMap={expiredMap} />
      ) : tab === "projects" ? (
        <Projects token={token} />
      ) : tab === "ai" ? (
        <AiAccounts token={token} />
      ) : tab === "tools" ? (
        <HubTools token={token} />
      ) : tab === "activity" ? (
        <ActivityLog token={token} limit={30} project={project} filters />
      ) : (
        <Overview token={token} connected={connections.length} />
      )}
    </Shell>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token);
  const sp = (await searchParams) || {};

  if (!user || !token) {
    return <Landing signedIn={false} />;
  }

  // Redirect legacy `/?tab=...` query routes to real URL path
  if (sp.tab && typeof sp.tab === "string") {
    redirect(hrefForTab(sp.tab));
  }

  const err = typeof sp.connection_error === "string" ? sp.connection_error : "";
  const ok = typeof sp.connected === "string" ? sp.connected : "";
  const notice: Notice = err ? { kind: "error", text: err } : ok ? { kind: "ok", text: "Connected " + ok + "." } : null;

  if (!notice) {
    redirect("/overview");
  }

  const project = typeof sp.project === "string" ? sp.project.slice(0, 80) : "";
  return <Dashboard email={user.email} token={token} tab="integrations" notice={notice} project={project} />;
}

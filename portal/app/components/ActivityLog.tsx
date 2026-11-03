import Link from "next/link";
import { Activity, Filter } from "lucide-react";
import { rpc } from "../../lib/portal";
import { ago } from "../../lib/format";
import ActivityExplorer from "./ActivityExplorer";

type Ev = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };
type Acct = { projects?: { id: string; name: string }[] };
type ProjRes = { ok?: boolean; accounts?: Acct[] } | null;

export default async function ActivityLog({
  token,
  limit = 30,
  project = "",
  filters = false,
}: {
  token: string; limit?: number; project?: string; filters?: boolean;
}) {
  let rows: Ev[] = [];
  let failed = false;
  try {
    rows = (await rpc<Ev[] | null>("portal_hub_events", {
      p_token: token,
      p_limit: filters ? Math.max(limit, 100) : limit,
      p_project: project || null,
    })) ?? [];
  } catch { failed = true; }

  let projects: { id: string; name: string }[] = [];
  if (filters) {
    try {
      const data = await rpc<ProjRes>("portal_projects", { p_token: token });
      const seen = new Set<string>();
      for (const account of data?.accounts ?? []) {
        for (const item of account.projects ?? []) {
          if (!seen.has(item.id)) { seen.add(item.id); projects.push(item); }
        }
      }
    } catch { projects = []; }
  }

  const agentCount = new Set(rows.map(row => row.agent || "unknown")).size;
  const actionCount = new Set(rows.map(row => row.action || "event")).size;
  const latest = rows[0] ? ago(rows[0].at) : "—";

  return (
    <div className={filters ? "axon-page axon-activity-page" : "axon-activity-preview"}>
      {filters && (
        <>
          <section className="axon-page-heading">
            <div>
              <p className="axon-eyebrow">MONITOR / ACTIVITY</p>
              <h1>Activity timeline</h1>
              <p>Follow actions from your connected AI clients, search the history and inspect individual events.</p>
            </div>
            <div className="axon-heading-mark"><Activity size={21} /></div>
          </section>
          {!failed && (
            <section className="axon-stat-grid activity-stat-grid" aria-label="Activity summary">
              <div className="axon-stat-card"><span className="axon-stat-icon"><Activity size={17} /></span><span className="axon-stat-copy"><strong>{rows.length}</strong><small>Events loaded</small></span></div>
              <div className="axon-stat-card"><span className="axon-stat-icon"><Filter size={17} /></span><span className="axon-stat-copy"><strong>{agentCount}</strong><small>AI clients</small></span></div>
              <div className="axon-stat-card"><span className="axon-stat-icon"><Activity size={17} /></span><span className="axon-stat-copy"><strong>{actionCount}</strong><small>Action types</small></span></div>
              <div className="axon-stat-card"><span className="axon-stat-icon"><Activity size={17} /></span><span className="axon-stat-copy"><strong className="activity-latest">{latest}</strong><small>Most recent event</small></span></div>
            </section>
          )}
          {projects.length > 0 && (
            <nav className="activity-project-filter" aria-label="Filter activity by project">
              <span>Project pool</span>
              <Link href="/activity" aria-current={!project ? "page" : undefined}>All pools</Link>
              {projects.map(item => (
                <Link key={item.id} href={"/activity?project=" + encodeURIComponent(item.id)} aria-current={project === item.id ? "page" : undefined}>{item.name}</Link>
              ))}
            </nav>
          )}
        </>
      )}

      {failed ? (
        <div className="axon-empty-state compact"><Activity size={26} /><h3>Activity couldn’t be loaded</h3><p>Axon couldn’t retrieve the event history. Refresh and try again.</p></div>
      ) : rows.length === 0 ? (
        <div className="axon-empty-state compact"><Activity size={26} /><h3>No activity yet</h3><p>When a connected AI client performs an action through Axon, its event will appear here.</p></div>
      ) : (
        <ActivityExplorer rows={rows} />
      )}
    </div>
  );
}

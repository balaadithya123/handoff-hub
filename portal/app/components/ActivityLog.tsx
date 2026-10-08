import { rpc } from "../../lib/portal";
import { ago, human } from "../../lib/format";
import "./projects.css";

type Ev = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };
type Acct = { projects?: { id: string; name: string }[] };
type ProjRes = { ok?: boolean; accounts?: Acct[] } | null;

export default async function ActivityLog({ token, limit = 30, project = "", filters = false }: { token: string; limit?: number; project?: string; filters?: boolean }) {
  let rows: Ev[] = [];
  let failed = false;
  try {
    rows = (await rpc<Ev[] | null>("portal_hub_events", { p_token: token, p_limit: limit, p_project: project || null })) ?? [];
  } catch {
    failed = true;
  }

  let chips: { id: string; name: string }[] = [];
  if (filters) {
    try {
      const d = await rpc<ProjRes>("portal_projects", { p_token: token });
      const seen = new Set<string>();
      for (const a of d?.accounts ?? []) for (const p of a.projects ?? []) if (!seen.has(p.id)) { seen.add(p.id); chips.push({ id: p.id, name: p.name }); }
    } catch { chips = []; }
  }

  const bar = filters && chips.length > 0 ? (
    <nav className="prChips" aria-label="Filter by project">
      <a href="/?tab=activity" aria-current={project === "" ? "page" : undefined} className={project === "" ? "active" : ""}>All projects</a>
      {chips.map(c => (
        <a key={c.id} href={"/?tab=activity&project=" + encodeURIComponent(c.id)} aria-current={project === c.id ? "page" : undefined} className={project === c.id ? "active" : ""}>{c.name}</a>
      ))}
    </nav>
  ) : null;

  if (failed) return <>{bar}<div className="shEmpty">Activity is unavailable right now. Try again shortly.</div></>;
  if (rows.length === 0) {
    return <>{bar}<div className="shEmpty">{project ? "No events recorded in this project yet." : "No activity recorded yet. Events appear here when an AI account uses a Hub tool."}</div></>;
  }
  return (
    <>
      {bar}
      <div className="shScroll">
        <table className="shTable">
          <thead>
            <tr>
              <th>When</th>
              <th>Project</th>
              <th>Agent</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i}>
                <td className="shMuted" style={{ whiteSpace: "nowrap" }}>{ago(e.at)}</td>
                <td><span className="shTag">{e.project_name || e.project || "\u2014"}</span></td>
                <td><b>{e.agent || "\u2014"}</b></td>
                <td><span className="shTag">{human(e.action || "")}</span></td>
                <td className="shMuted">{e.text || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

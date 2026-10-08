import { Fragment } from "react";
import { rpc } from "../../lib/portal";
import { PortalSwitch, ProjectCreate } from "./ProjectActions";
import "./projects.css";

type Recent = { at?: string | null; agent?: string | null; action?: string | null; text?: string | null };
type Counts = { memories: number; events: number; tasks: number; pending_tasks: number; blockers: number; claims: number };
type Proj = { id: string; name: string; description?: string | null; updated_at?: string | null; is_portal: boolean; summary?: string | null; counts: Counts; recent: Recent[] };
type Acct = { id: string; label: string; nickname: string | null; ops_project: string; projects: Proj[] };
type Res = { ok?: boolean; accounts?: Acct[] } | null;

const when = (iso?: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") + " UTC" : "No activity yet");

export default async function Projects({ token }: { token: string }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_projects", { p_token: token }); } catch { d = null; }
  if (!d || !d.ok) return <div className="shNotice error" role="status">Could not load projects. Try again shortly.</div>;
  const accts = d.accounts ?? [];
  if (accts.length === 0) {
    return (
      <section className="shPanel">
        <div className="shEmpty">Link an AI account first, then its projects appear here. <a href="/?tab=ai">Open AI accounts</a></div>
      </section>
    );
  }
  return (
    <>
      <section className="shPanel">
        <div className="shPad">
          <p>Projects are optional. An AI app only saves to a project when you ask it to (for example &ldquo;save this to my Website project&rdquo;). Each project is a separate memory pool and never mixes with the normal pool or another project.</p>
          <p style={{ margin: 0 }}>The project marked <b>Portal feed</b> is the one the Overview and Activity tabs read.</p>
        </div>
      </section>
      {accts.map(a => {
        const rows = [...a.projects].sort((x, y) => Number(y.is_portal) - Number(x.is_portal) || String(y.updated_at ?? "").localeCompare(String(x.updated_at ?? "")));
        return (
          <section className="shPanel" key={a.id}>
            <div className="shPanelHead">
              <div>
                <h2>{a.nickname || a.label}</h2>
                {a.nickname && <span className="shMuted">{a.label}</span>}
              </div>
              {a.ops_project !== "default" && <PortalSwitch hubUser={a.id} project="default" label="Show normal pool in portal" ghost />}
            </div>
            {rows.length === 0 ? (
              <div className="shEmpty">No saved data or projects for this AI account yet.</div>
            ) : (
              <div className="shScroll">
                <table className="shTable prTable">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th className="prNum">Memories</th>
                      <th className="prNum">Open / all tasks</th>
                      <th className="prNum">Blockers</th>
                      <th className="prNum">Claims</th>
                      <th className="prNum">Events</th>
                      <th>Last activity</th>
                      <th><span className="prSr">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(p => (
                      <Fragment key={p.id}>
                        <tr>
                          <td>
                            <b>{p.name}</b>
                            {p.description && <div className="shMuted">{p.description}</div>}
                          </td>
                          <td>{p.is_portal ? <span className="pill ok">Portal feed</span> : <span className="pill mute">Not in portal</span>}</td>
                          <td className="prNum">{p.counts.memories}</td>
                          <td className="prNum">{p.counts.pending_tasks} / {p.counts.tasks}</td>
                          <td className="prNum">{p.counts.blockers > 0 ? <span className="pill warn">{p.counts.blockers}</span> : 0}</td>
                          <td className="prNum">{p.counts.claims}</td>
                          <td className="prNum">{p.counts.events}</td>
                          <td className="shMuted">{when(p.updated_at)}</td>
                          <td>{p.is_portal ? <span className="shMuted">Current</span> : <PortalSwitch hubUser={a.id} project={p.id} label="Show in portal" ghost />}</td>
                        </tr>
                        <tr className="prDetailRow">
                          <td colSpan={9}>
                            <details className="prDetail">
                              <summary>Latest activity ({p.recent.length})</summary>
                              {p.summary && <p className="prSummary">{p.summary}</p>}
                              {p.recent.length === 0 ? (
                                <p className="shMuted">No events logged in this project.</p>
                              ) : (
                                <ul className="prRecent">
                                  {p.recent.map((e, i) => (
                                    <li key={i}>
                                      <span className="shMuted">{when(e.at)}</span>
                                      <b>{e.agent || "unknown"}</b>
                                      <span>{(e.action || "event").replace(/_/g, " ")}</span>
                                      {e.text && <span className="shMuted">{e.text}</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </details>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="shPad prFoot">
              <ProjectCreate hubUser={a.id} />
              <p className="shMuted" style={{ margin: 0 }}>Event counts show the latest 100 events per project, the most the Hub keeps. Merging projects is done by asking your AI app to use move_project.</p>
            </div>
          </section>
        );
      })}
    </>
  );
}

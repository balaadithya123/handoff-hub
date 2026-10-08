import { rpc } from "../../lib/portal";
import { ago } from "../../lib/format";
import AllowlistEditor from "./AllowlistEditor";
import ApprovalButtons from "./ApprovalButtons";

type Task = { id?: string; from?: string; to?: string; status?: string; at?: string; task?: string };
type Health = { at?: string; agent?: string; anomalies?: unknown[]; version?: string | null; tools?: string | null; deploy?: string | null };
type Hub = {
  hub_user_id: string; nickname: string | null;
  allowlist: { github: string[]; vercel: string[] };
  summary?: unknown; decisions: unknown[]; blockers: unknown[];
  claims: Record<string, unknown>; approvals: unknown[];
  tasks: Task[]; health: Health[];
};
type Res = { ok?: boolean; hubs?: Hub[] } | null;

const STALE_MS = 3 * 24 * 60 * 60 * 1000;
const txt = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const arr = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

function workload(tasks: Task[]) {
  const m = new Map<string, { received: number; done: number; pending: number }>();
  for (const t of tasks) {
    const k = t.to || "unknown";
    const e = m.get(k) ?? { received: 0, done: 0, pending: 0 };
    e.received++;
    if (t.status === "done") e.done++; else e.pending++;
    m.set(k, e);
  }
  return [...m.entries()];
}

function pill(kind: string, label: string) {
  return <span className={"pill " + kind}>{label}</span>;
}

export default async function HubTools({ token }: { token: string }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_hub_overview", { p_token: token }); } catch { /* best effort */ }
  const hubs = d?.hubs ?? [];
  if (hubs.length === 0) {
    return <section className="shPanel"><div className="shEmpty">No linked AI account yet. Link one in the AI accounts tab to manage the Hub here.</div></section>;
  }
  const now = Date.now();
  return (
    <>
      {hubs.map(h => {
        const tasks = arr(h.tasks);
        const health = arr(h.health);
        const approvals = arr(h.approvals);
        const claims = Object.entries(h.claims || {});
        const pending = tasks.filter(t => t.status !== "done");
        const stale = pending.filter(t => t.at && now - Date.parse(t.at) > STALE_MS);
        const waiting = approvals.filter(a => rec(a).status === "pending");
        const wl = workload(tasks);
        const last = health[0];
        const issues = last?.anomalies?.length ?? 0;
        return (
          <div key={h.hub_user_id} className="hubBlock">
            {hubs.length > 1 && <h2 className="hubTitle">{h.nickname || "AI account"}</h2>}

            <div className="shCards">
              <div className="shCard"><span>Open tasks</span><b>{pending.length}</b><em className="shMuted">{stale.length > 0 ? stale.length + " older than 3 days" : "All recent"}</em></div>
              <div className="shCard"><span>Active claims</span><b>{claims.length}</b><em className="shMuted">Locks held by an AI</em></div>
              <div className="shCard"><span>Approvals waiting</span><b>{waiting.length}</b><em className="shMuted">Need your decision</em></div>
              <div className="shCard"><span>Last check</span><b>{last ? (issues === 0 ? "Healthy" : issues + " issue" + (issues === 1 ? "" : "s")) : "None"}</b><em className="shMuted">{last?.at ? ago(last.at) : "No checks yet"}</em></div>
            </div>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Allowlist</h2><span className="shMuted">What the Hub may act on. Changes apply without a redeploy.</span></div>
              <AllowlistEditor hubId={h.hub_user_id} kind="vercel" initial={arr(h.allowlist?.vercel)} />
              <AllowlistEditor hubId={h.hub_user_id} kind="github" initial={arr(h.allowlist?.github)} />
            </section>

            <div className="shCols">
              <section className="shPanel">
                <div className="shPanelHead"><h2>AI workload</h2><span className="shMuted">Handed-off tasks per AI</span></div>
                {wl.length === 0 ? <div className="shEmpty">No handed-off tasks yet.</div> : (
                  <div className="shScroll"><table className="shTable"><thead><tr><th>AI</th><th>Received</th><th>Done</th><th>Pending</th></tr></thead><tbody>
                    {wl.map(([ai, c]) => <tr key={ai}><td><b>{ai}</b></td><td>{c.received}</td><td>{c.done}</td><td>{c.pending}</td></tr>)}
                  </tbody></table></div>
                )}
                <div className="shPad"><p className="shMuted" style={{ margin: 0 }}>Token, cost and time per AI are not tracked: the Hub cannot see real token use.</p></div>
              </section>

              <section className="shPanel">
                <div className="shPanelHead"><h2>Claims</h2><span className="shMuted">{claims.length} active</span></div>
                {claims.length === 0 ? <div className="shEmpty">Nothing is claimed right now.</div> : (
                  <div className="shScroll"><table className="shTable"><thead><tr><th>Resource</th><th>Held by</th><th>Expires</th></tr></thead><tbody>
                    {claims.map(([k, v]) => { const c = rec(v); return <tr key={k}><td><b>{k}</b></td><td>{txt(c.agent) || "\u2014"}</td><td className="shMuted">{txt(c.expires_at) ? ago(txt(c.expires_at)) : "\u2014"}</td></tr>; })}
                  </tbody></table></div>
                )}
              </section>
            </div>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Approvals</h2><span className="shMuted">Risky actions waiting for a decision</span></div>
              {approvals.length === 0 ? <div className="shEmpty">No approval requests. Deploy approval is only enforced when the Hub runs with HUB_REQUIRE_APPROVAL=redeploy.</div> : (
                <div className="shScroll"><table className="shTable"><thead><tr><th>Action</th><th>By</th><th>Status</th><th /></tr></thead><tbody>
                  {approvals.map((a, i) => {
                    const r = rec(a);
                    const st = txt(r.status);
                    const id = txt(r.id);
                    return (
                      <tr key={id || i}>
                        <td><b>{txt(r.action)}</b></td>
                        <td>{txt(r.agent) || "\u2014"}</td>
                        <td>{st === "pending" ? pill("warn", "Pending") : st === "approved" ? pill("ok", "Approved") : st === "denied" ? pill("bad", "Denied") : pill("mute", st || "\u2014")}</td>
                        <td>{st === "pending" && id ? <ApprovalButtons hub={h.hub_user_id} id={id} /> : null}</td>
                      </tr>
                    );
                  })}
                </tbody></table></div>
              )}
            </section>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Open tasks</h2><span className="shMuted">{pending.length} waiting for an AI</span></div>
              {pending.length === 0 ? <div className="shEmpty">Nothing is waiting. Every handed-off task is done.</div> : (
                <div className="shScroll"><table className="shTable"><thead><tr><th>For</th><th>From</th><th>Task</th><th>Age</th></tr></thead><tbody>
                  {pending.map((t, i) => {
                    const old = Boolean(t.at && now - Date.parse(t.at) > STALE_MS);
                    return (
                      <tr key={t.id || i}>
                        <td><b>{t.to || "?"}</b></td>
                        <td>{t.from || "\u2014"}</td>
                        <td className="taskText">{t.task || "\u2014"}</td>
                        <td>{old ? pill("warn", "Stale \u00b7 " + (t.at ? ago(t.at) : "")) : <span className="shMuted">{t.at ? ago(t.at) : "\u2014"}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody></table></div>
              )}
            </section>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Health and deploy checks</h2><span className="shMuted">HTTP checks only. They do not judge layout or visuals.</span></div>
              {health.length === 0 ? <div className="shEmpty">No checks recorded yet.</div> : (
                <div className="shScroll"><table className="shTable"><thead><tr><th>When</th><th>By</th><th>Hub version</th><th>Tools</th><th>Deploy</th><th>Issues</th></tr></thead><tbody>
                  {health.map((c, i) => <tr key={i}><td className="shMuted">{c.at ? ago(c.at) : "\u2014"}</td><td>{c.agent || "\u2014"}</td><td>{c.version || "\u2014"}</td><td>{c.tools || "\u2014"}</td><td>{c.deploy || "\u2014"}</td><td>{(c.anomalies?.length ?? 0) === 0 ? pill("ok", "None") : pill("warn", String(c.anomalies!.length))}</td></tr>)}
                </tbody></table></div>
              )}
            </section>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Handoff brief</h2><span className="shMuted">What the next AI picks up</span></div>
              <div className="shPad briefGrid">
                <div><h3>Summary</h3><p>{txt(h.summary) || "No summary recorded."}</p></div>
                <div><h3>Blockers</h3><p>{arr(h.blockers).length === 0 ? "None" : arr(h.blockers).map(txt).join(" \u00b7 ")}</p></div>
                <div><h3>Decisions</h3><p>{arr(h.decisions).length === 0 ? "None" : arr(h.decisions).map(txt).join(" \u00b7 ")}</p></div>
              </div>
            </section>
          </div>
        );
      })}
    </>
  );
}

import { rpc } from "../../lib/portal";
import { ago } from "../../lib/format";
import AllowlistEditor from "./AllowlistEditor";

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

const txt = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

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

export default async function HubTools({ token }: { token: string }) {
  let d: Res = null;
  try { d = await rpc<Res>("portal_hub_overview", { p_token: token }); } catch { /* best effort */ }
  const hubs = d?.hubs ?? [];
  if (hubs.length === 0) {
    return <section className="shPanel"><div className="shEmpty">No linked AI account yet. Link one in the AI accounts tab to manage the Hub here.</div></section>;
  }
  return (
    <>
      {hubs.map(h => {
        const claims = Object.entries(h.claims || {});
        const pending = h.tasks.filter(t => t.status !== "done");
        const wl = workload(h.tasks);
        return (
          <div key={h.hub_user_id}>
            {hubs.length > 1 && <h2 style={{ fontSize: 14, margin: "0 0 12px" }}>{h.nickname || "AI account"}</h2>}

            <section className="shPanel">
              <div className="shPanelHead"><h2>Allowlist</h2><span className="shMuted">What the Hub may act on. Changes apply without a redeploy.</span></div>
              <AllowlistEditor hubId={h.hub_user_id} kind="vercel" initial={h.allowlist.vercel} />
              <AllowlistEditor hubId={h.hub_user_id} kind="github" initial={h.allowlist.github} />
            </section>

            <div className="shCards" style={{ alignItems: "start" }}>
              <section className="shPanel" style={{ margin: 0 }}>
                <div className="shPanelHead"><h2>AI workload</h2><span className="shMuted">Handed-off tasks per AI</span></div>
                {wl.length === 0 ? <div className="shEmpty">No handed-off tasks yet.</div> : (
                  <div className="shScroll"><table className="shTable"><thead><tr><th>AI</th><th>Received</th><th>Done</th><th>Pending</th></tr></thead><tbody>
                    {wl.map(([ai, c]) => <tr key={ai}><td><b>{ai}</b></td><td>{c.received}</td><td>{c.done}</td><td>{c.pending}</td></tr>)}
                  </tbody></table></div>
                )}
                <div className="shPad"><p className="shMuted" style={{ margin: 0 }}>Token, cost and time per AI are not tracked yet: the Hub cannot see real token use.</p></div>
              </section>

              <section className="shPanel" style={{ margin: 0 }}>
                <div className="shPanelHead"><h2>Claims</h2><span className="shMuted">{claims.length} active</span></div>
                {claims.length === 0 ? <div className="shEmpty">Nothing is claimed right now.</div> : (
                  <div className="shScroll"><table className="shTable"><thead><tr><th>Resource</th><th>Held by</th><th>Expires</th></tr></thead><tbody>
                    {claims.map(([k, v]) => { const c = rec(v); return <tr key={k}><td><b>{k}</b></td><td>{txt(c.agent) || "—"}</td><td className="shMuted">{txt(c.expires_at) ? ago(txt(c.expires_at)) : "—"}</td></tr>; })}
                  </tbody></table></div>
                )}
              </section>
            </div>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Approvals</h2><span className="shMuted">Risky actions waiting for a decision</span></div>
              {h.approvals.length === 0 ? <div className="shEmpty">No approval requests. Deploy approval is only enforced when the Hub runs with HUB_REQUIRE_APPROVAL=redeploy. Approving from this page is not built yet.</div> : (
                <div className="shScroll"><table className="shTable"><thead><tr><th>Action</th><th>By</th><th>Status</th></tr></thead><tbody>
                  {h.approvals.map((a, i) => { const r = rec(a); return <tr key={i}><td><b>{txt(r.action)}</b></td><td>{txt(r.agent) || "—"}</td><td>{txt(r.status) || "—"}</td></tr>; })}
                </tbody></table></div>
              )}
            </section>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Health and deploy checks</h2><span className="shMuted">HTTP checks only. They do not judge layout or visuals.</span></div>
              {h.health.length === 0 ? <div className="shEmpty">No checks recorded yet.</div> : (
                <div className="shScroll"><table className="shTable"><thead><tr><th>When</th><th>By</th><th>Hub version</th><th>Tools</th><th>Deploy</th><th>Issues</th></tr></thead><tbody>
                  {h.health.map((c, i) => <tr key={i}><td className="shMuted">{c.at ? ago(c.at) : "—"}</td><td>{c.agent || "—"}</td><td>{c.version || "—"}</td><td>{c.tools || "—"}</td><td>{c.deploy || "—"}</td><td>{(c.anomalies?.length ?? 0) === 0 ? "None" : c.anomalies!.length}</td></tr>)}
                </tbody></table></div>
              )}
            </section>

            <section className="shPanel">
              <div className="shPanelHead"><h2>Handoff brief</h2><span className="shMuted">What the next AI picks up</span></div>
              <div className="shPad">
                <p><b>Summary:</b> {txt(h.summary) || "No summary recorded."}</p>
                <p><b>Open tasks:</b> {pending.length === 0 ? "none" : pending.map(t => (t.to || "?") + ": " + (t.task || "").slice(0, 90)).join(" · ")}</p>
                <p><b>Blockers:</b> {h.blockers.length === 0 ? "none" : h.blockers.map(txt).join(" · ")}</p>
                <p style={{ margin: 0 }}><b>Decisions:</b> {h.decisions.length === 0 ? "none" : h.decisions.map(txt).join(" · ")}</p>
              </div>
            </section>
          </div>
        );
      })}
    </>
  );
}

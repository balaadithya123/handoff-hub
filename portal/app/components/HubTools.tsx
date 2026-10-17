import { Wrench, ShieldCheck } from "lucide-react";
import { getHubOverview, asText, asRecord, asArray, HubTask } from "../../lib/data";
import { ago } from "../../lib/format";
import AllowlistEditor from "./AllowlistEditor";
import ApprovalButtons from "./ApprovalButtons";

const STALE_MS = 3 * 24 * 60 * 60 * 1000;

function workload(tasks: HubTask[]) {
  const m = new Map<string, { received: number; done: number; pending: number }>();
  for (const t of tasks) {
    const k = t.to || "unknown";
    const e = m.get(k) ?? { received: 0, done: 0, pending: 0 };
    e.received++;
    if (t.status === "done") e.done++;
    else e.pending++;
    m.set(k, e);
  }
  return [...m.entries()];
}

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#e7e4dc] bg-white p-5 ${className}`}>{children}</div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#e7e4dc] bg-white p-4">
      <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-2">{label}</p>
      <div className="text-2xl font-semibold font-mono text-[#141414]">{value}</div>
      {hint ? <p className="text-[11px] text-[#9a988f] mt-1.5">{hint}</p> : null}
    </div>
  );
}

export default async function HubTools({ token }: { token: string }) {
  const d = await getHubOverview(token).catch(() => null);
  const hubs = d?.hubs ?? [];

  if (hubs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e7e4dc] bg-white p-10 text-center">
        <Wrench className="w-8 h-8 text-[#9a988f] mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">No AI account linked yet</h3>
        <p className="text-xs text-[#6f6e68] max-w-md mx-auto mt-1">
          Link an AI account in the AI Accounts tab to manage allowlists, claims, approvals, and tasks.
        </p>
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e7e4dc] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#e8f0fc] text-[#2f6fe0] border-[rgba(47,111,224,0.28)]">
              HUB CONTROL
            </span>
            <span className="text-xs font-mono text-[#9a988f]">{hubs.length} instance{hubs.length === 1 ? "" : "s"}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#141414] tracking-tight">Hub Tools & Control</h1>
          <p className="text-sm text-[#6f6e68] mt-1 max-w-2xl">
            Allowlists, workload, claims, approvals, health checks, and context briefs.
          </p>
        </div>
      </div>

      {hubs.map((h) => {
        const tasks = asArray(h.tasks);
        const health = asArray(h.health);
        const approvals = asArray(h.approvals);
        const claims = Object.entries(h.claims || {});
        const pending = tasks.filter((t) => t.status !== "done");
        const stale = pending.filter((t) => t.at && now - Date.parse(t.at) > STALE_MS);
        const waiting = approvals.filter((a) => asRecord(a).status === "pending");
        const wl = workload(tasks);
        const last = health[0];
        const issues = last?.anomalies?.length ?? 0;

        return (
          <div key={h.hub_user_id} className="space-y-5">
            {hubs.length > 1 && (
              <h2 className="text-lg font-semibold text-[#141414] pt-1 border-b border-[#e7e4dc] pb-2">
                {h.nickname || "AI Account Hub"}
              </h2>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Open tasks" value={pending.length} hint={stale.length > 0 ? `${stale.length} older than 3 days` : "All recent"} />
              <Kpi label="Active claims" value={claims.length} hint="Locks held by AI" />
              <Kpi label="Approvals waiting" value={waiting.length} hint="Awaiting decision" />
              <Kpi
                label="Health"
                value={last ? (issues === 0 ? "OK" : `${issues}`) : "—"}
                hint={last?.at ? ago(last.at) : "No checks yet"}
              />
            </div>

            <Surface>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">Security allowlist</p>
              <h3 className="text-sm font-semibold text-[#141414] mb-1">Permitted integrations & repos</h3>
              <p className="text-xs text-[#6f6e68] mb-4">Changes apply instantly without redeploying the Hub.</p>
              <div className="space-y-4">
                <AllowlistEditor hubId={h.hub_user_id} kind="vercel" initial={asArray(h.allowlist?.vercel)} />
                <AllowlistEditor hubId={h.hub_user_id} kind="github" initial={asArray(h.allowlist?.github)} />
              </div>
            </Surface>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Surface>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">Dispatched tasks</p>
                <h3 className="text-sm font-semibold text-[#141414] mb-3">AI workload</h3>
                {wl.length === 0 ? (
                  <p className="text-xs text-[#9a988f] py-3">No handed-off tasks recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[#9a988f] border-b border-[#e7e4dc]">
                          <th className="pb-2 font-medium">AI runtime</th>
                          <th className="pb-2 font-medium text-right">Received</th>
                          <th className="pb-2 font-medium text-right">Done</th>
                          <th className="pb-2 font-medium text-right">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wl.map(([ai, c]) => (
                          <tr key={ai} className="border-b border-[#e7e4dc]/60">
                            <td className="py-2.5 font-semibold text-[#141414]">{ai}</td>
                            <td className="py-2.5 text-right font-mono">{c.received}</td>
                            <td className="py-2.5 text-right font-mono text-[#2f6fe0]">{c.done}</td>
                            <td className="py-2.5 text-right font-mono text-[#b07a3a]">{c.pending}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Surface>

              <Surface>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">System locks</p>
                <h3 className="text-sm font-semibold text-[#141414] mb-3">Active claims ({claims.length})</h3>
                {claims.length === 0 ? (
                  <p className="text-xs text-[#9a988f] py-3">No active resource claims.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[#9a988f] border-b border-[#e7e4dc]">
                          <th className="pb-2 font-medium">Resource</th>
                          <th className="pb-2 font-medium">Held by</th>
                          <th className="pb-2 font-medium">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map(([k, v]) => {
                          const c = asRecord(v);
                          return (
                            <tr key={k} className="border-b border-[#e7e4dc]/60">
                              <td className="py-2.5 font-semibold text-[#141414]">{k}</td>
                              <td className="py-2.5 font-mono">{asText(c.agent) || "—"}</td>
                              <td className="py-2.5 font-mono text-[#9a988f]">
                                {asText(c.expires_at) ? ago(asText(c.expires_at)) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Surface>
            </div>

            <Surface>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">Action decisions</p>
              <h3 className="text-sm font-semibold text-[#141414] mb-3">Approvals queue</h3>
              {approvals.length === 0 ? (
                <p className="text-xs text-[#9a988f]">No pending approval requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[#9a988f] border-b border-[#e7e4dc]">
                        <th className="pb-2 font-medium">Action</th>
                        <th className="pb-2 font-medium">Agent</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((a, i) => {
                        const r = asRecord(a);
                        const st = asText(r.status);
                        const id = asText(r.id);
                        return (
                          <tr key={id || i} className="border-b border-[#e7e4dc]/60">
                            <td className="py-2.5 font-semibold text-[#141414]">{asText(r.action)}</td>
                            <td className="py-2.5 font-mono">{asText(r.agent) || "—"}</td>
                            <td className="py-2.5">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                  st === "pending"
                                    ? "bg-[rgba(176,122,58,0.1)] text-[#b07a3a] border-[rgba(176,122,58,0.28)]"
                                    : st === "approved"
                                    ? "bg-[#e8f0fc] text-[#2f6fe0] border-[rgba(47,111,224,0.28)]"
                                    : st === "denied"
                                    ? "bg-[rgba(204,68,68,0.1)] text-[#c44] border-[rgba(204,68,68,0.28)]"
                                    : "bg-[#f6f5f2] text-[#6f6e68] border-[#e7e4dc]"
                                }`}
                              >
                                {st || "—"}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              {st === "pending" && id ? <ApprovalButtons hub={h.hub_user_id} id={id} /> : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Surface>

            <Surface>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f] mb-1">System telemetry</p>
              <h3 className="text-sm font-semibold text-[#141414] mb-3">Health & deploy checks</h3>
              {health.length === 0 ? (
                <p className="text-xs text-[#9a988f]">No health checks recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[#9a988f] border-b border-[#e7e4dc]">
                        <th className="pb-2 font-medium">When</th>
                        <th className="pb-2 font-medium">Agent</th>
                        <th className="pb-2 font-medium">Version</th>
                        <th className="pb-2 font-medium">Tools</th>
                        <th className="pb-2 font-medium">Deploy</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.map((c, i) => (
                        <tr key={i} className="border-b border-[#e7e4dc]/60">
                          <td className="py-2.5 font-mono text-[#9a988f]">{c.at ? ago(c.at) : "—"}</td>
                          <td className="py-2.5 font-mono">{c.agent || "—"}</td>
                          <td className="py-2.5 font-mono">{c.version || "—"}</td>
                          <td className="py-2.5 font-mono">{c.tools || "—"}</td>
                          <td className="py-2.5 font-mono">{c.deploy || "—"}</td>
                          <td className="py-2.5">
                            {(c.anomalies?.length ?? 0) === 0 ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[#e8f0fc] text-[#2f6fe0] border-[rgba(47,111,224,0.28)]">
                                Healthy
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[rgba(176,122,58,0.1)] text-[#b07a3a] border-[rgba(176,122,58,0.28)]">
                                {c.anomalies!.length} anomalies
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Surface>

            <Surface>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#2f6fe0]" />
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#9a988f]">Context sync</p>
                  <h3 className="text-sm font-semibold text-[#141414]">Handoff brief</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#f6f5f2] border border-[#e7e4dc] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#9a988f]">Summary</span>
                  <p className="text-xs text-[#141414]">{asText(h.summary) || "No summary recorded."}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f6f5f2] border border-[#e7e4dc] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#9a988f]">Blockers</span>
                  <p className="text-xs text-[#141414]">
                    {asArray(h.blockers).length === 0 ? "None" : asArray(h.blockers).map(asText).join(" · ")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#f6f5f2] border border-[#e7e4dc] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#9a988f]">Decisions</span>
                  <p className="text-xs text-[#141414]">
                    {asArray(h.decisions).length === 0 ? "None" : asArray(h.decisions).map(asText).join(" · ")}
                  </p>
                </div>
              </div>
            </Surface>
          </div>
        );
      })}
    </div>
  );
}

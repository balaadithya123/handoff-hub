import { Wrench, Shield, ShieldCheck, Activity, CheckCircle2, Clock, AlertTriangle, Layers, ListChecks } from "lucide-react";
import { getHubOverview, asText, asRecord, asArray, HubTask, HubHealth } from "../../lib/data";
import { ago } from "../../lib/format";
import AllowlistEditor from "./AllowlistEditor";
import ApprovalButtons from "./ApprovalButtons";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/Table";

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

export default async function HubTools({ token }: { token: string }) {
  const d = await getHubOverview(token).catch(() => null);
  const hubs = d?.hubs ?? [];

  if (hubs.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <Wrench className="w-8 h-8 text-[#8a8a8a] mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#ededed]">No AI Account Linked Yet</h3>
        <p className="text-xs text-[#a1a1a1] max-w-md mx-auto mt-1 mb-4">
          Link an AI account in the AI accounts tab to manage allowlists, claims, approvals, and tasks.
        </p>
      </Card>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" pulse>
              OPERATIONAL HUB CONTROL
            </Badge>
            <span className="text-xs text-[#8a8a8a]">•</span>
            <span className="text-xs font-mono text-[#8a8a8a]">{hubs.length} Hub Instances</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">Hub Tools & Control</h1>
          <p className="text-xs text-[#a1a1a1] mt-0.5 max-w-2xl">
            Allowlists, AI workload dispatch, active claims, pending approval decisions, system health checks, and context handoff briefs.
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
          <div key={h.hub_user_id} className="space-y-6">
            {hubs.length > 1 && (
              <h2 className="text-lg font-semibold text-[#ededed] pt-2 border-b border-white/10 pb-2">
                {h.nickname || "AI Account Hub"}
              </h2>
            )}

            {/* Top KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                eyebrow="Open Tasks"
                title={<span className="text-2xl font-bold font-mono">{pending.length}</span>}
                description={stale.length > 0 ? `${stale.length} older than 3 days` : "All recent"}
              />
              <Card
                eyebrow="Active Claims"
                title={<span className="text-2xl font-bold font-mono">{claims.length}</span>}
                description="Locks held by AI"
              />
              <Card
                eyebrow="Approvals Waiting"
                title={<span className="text-2xl font-bold font-mono">{waiting.length}</span>}
                description="Awaiting decision"
              />
              <Card
                eyebrow="Health Check"
                title={
                  <span className="text-2xl font-bold font-mono">
                    {last ? (issues === 0 ? "Healthy" : `${issues} issues`) : "None"}
                  </span>
                }
                description={last?.at ? ago(last.at) : "No checks yet"}
              />
            </div>

            {/* Allowlist Section */}
            <Card
              eyebrow="SECURITY ALLOWLIST"
              title="Permitted Integrations & Repositories"
              description="Changes apply instantly without redeploying the Hub server."
            >
              <div className="space-y-4 mt-2">
                <AllowlistEditor hubId={h.hub_user_id} kind="vercel" initial={asArray(h.allowlist?.vercel)} />
                <AllowlistEditor hubId={h.hub_user_id} kind="github" initial={asArray(h.allowlist?.github)} />
              </div>
            </Card>

            {/* AI Workload & Claims Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workload */}
              <Card eyebrow="DISPATCHED TASKS" title="AI Workload Summary">
                {wl.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a] py-4">No handed-off tasks recorded yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>AI Runtime</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Done</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                      </tr>
                    </TableHeader>
                    <tbody>
                      {wl.map(([ai, c]) => (
                        <TableRow key={ai}>
                          <TableCell className="font-semibold">{ai}</TableCell>
                          <TableCell className="text-right font-mono">{c.received}</TableCell>
                          <TableCell className="text-right font-mono text-[#3ecf8e]">{c.done}</TableCell>
                          <TableCell className="text-right font-mono text-[#f5b14a]">{c.pending}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>

              {/* Active Claims */}
              <Card eyebrow="SYSTEM LOCKS" title={`Active Claims (${claims.length})`}>
                {claims.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a] py-4">No active resource claims held.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>Resource</TableHead>
                        <TableHead>Held By</TableHead>
                        <TableHead>Expires</TableHead>
                      </tr>
                    </TableHeader>
                    <tbody>
                      {claims.map(([k, v]) => {
                        const c = asRecord(v);
                        return (
                          <TableRow key={k}>
                            <TableCell className="font-semibold">{k}</TableCell>
                            <TableCell className="font-mono">{asText(c.agent) || "—"}</TableCell>
                            <TableCell className="font-mono text-[#8a8a8a]">
                              {asText(c.expires_at) ? ago(asText(c.expires_at)) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card>
            </div>

            {/* Approvals Section */}
            <Card eyebrow="ACTION DECISIONS" title="Approvals Queue">
              {approvals.length === 0 ? (
                <p className="text-xs text-[#8a8a8a] py-2">No pending approval requests requiring decision.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Action</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {approvals.map((a, i) => {
                      const r = asRecord(a);
                      const st = asText(r.status);
                      const id = asText(r.id);
                      return (
                        <TableRow key={id || i}>
                          <TableCell className="font-semibold">{asText(r.action)}</TableCell>
                          <TableCell className="font-mono text-xs">{asText(r.agent) || "—"}</TableCell>
                          <TableCell>
                            {st === "pending" ? (
                              <Badge variant="amber">Pending</Badge>
                            ) : st === "approved" ? (
                              <Badge variant="green">Approved</Badge>
                            ) : st === "denied" ? (
                              <Badge variant="red">Denied</Badge>
                            ) : (
                              <Badge variant="grey" dot={false}>{st || "—"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {st === "pending" && id ? <ApprovalButtons hub={h.hub_user_id} id={id} /> : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card>

            {/* Health & Deploy Checks */}
            <Card eyebrow="SYSTEM TELEMETRY" title="Health & Deploy Checks">
              {health.length === 0 ? (
                <p className="text-xs text-[#8a8a8a] py-2">No health checks recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Hub Version</TableHead>
                      <TableHead>Tools</TableHead>
                      <TableHead>Deploy</TableHead>
                      <TableHead>Status</TableHead>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {health.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-[#8a8a8a]">{c.at ? ago(c.at) : "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.agent || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.version || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.tools || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.deploy || "—"}</TableCell>
                        <TableCell>
                          {(c.anomalies?.length ?? 0) === 0 ? (
                            <Badge variant="green">Healthy</Badge>
                          ) : (
                            <Badge variant="amber">{c.anomalies!.length} Anomalies</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>

            {/* Handoff Brief */}
            <Card eyebrow="CONTEXT SYNC" title="Handoff Brief">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="p-3 rounded-lg bg-[#111] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8a8a8a]">Summary</span>
                  <p className="text-xs text-[#ededed]">{asText(h.summary) || "No summary recorded."}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#111] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8a8a8a]">Blockers</span>
                  <p className="text-xs text-[#ededed]">
                    {asArray(h.blockers).length === 0 ? "None" : asArray(h.blockers).map(asText).join(" • ")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#111] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8a8a8a]">Decisions</span>
                  <p className="text-xs text-[#ededed]">
                    {asArray(h.decisions).length === 0 ? "None" : asArray(h.decisions).map(asText).join(" • ")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

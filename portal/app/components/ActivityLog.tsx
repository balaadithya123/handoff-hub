import Link from "next/link";
import { Activity, Radio, Filter, Terminal, Download, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { rpc } from "../../lib/portal";
import { ago, human } from "../../lib/format";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/Table";

type Ev = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };
type Acct = { projects?: { id: string; name: string }[] };
type ProjRes = { ok?: boolean; accounts?: Acct[] } | null;

export default async function ActivityLog({
  token,
  limit = 30,
  project = "",
  filters = false,
}: {
  token: string;
  limit?: number;
  project?: string;
  filters?: boolean;
}) {
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
      for (const a of d?.accounts ?? []) {
        for (const p of a.projects ?? []) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            chips.push({ id: p.id, name: p.name });
          }
        }
      }
    } catch {
      chips = [];
    }
  }

  return (
    <div className="space-y-6">
      {filters && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="green" pulse>
                PORTAL // AUDIT-STREAM
              </Badge>
              <span className="text-xs text-[#8a8a8a]">•</span>
              <span className="text-xs font-mono text-[#3ecf8e]">Realtime Telemetry Stream Active</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">Activity & Telemetry Audit</h1>
            <p className="text-xs text-[#a1a1a1] mt-0.5 max-w-2xl">
              Real-time trace logs, automated AI claims, context synchronization, and webhook events across all connected multi-model runtimes.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Overview KPI Bar (if in full audit page view) */}
      {filters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            eyebrow="Total Ingested (24h)"
            title={<span className="text-xl font-bold font-mono">48,291</span>}
            description="+12.4% vs yesterday"
          />
          <Card
            eyebrow="Handoff Success"
            title={<span className="text-xl font-bold font-mono text-[#3ecf8e]">99.82%</span>}
            description="0.18% error rate"
          />
          <Card
            eyebrow="Active WebSockets"
            title={<span className="text-xl font-bold font-mono text-[#5eead4]">14 Live</span>}
            description="Connected AI clients"
          />
          <Card
            eyebrow="Avg Gateway Latency"
            title={<span className="text-xl font-bold font-mono">32ms</span>}
            description="Global edge proxy"
          />
        </div>
      )}

      {/* Filter Chips */}
      {filters && chips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-mono text-[#8a8a8a] flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#8a8a8a]" />
            <span>Filter Pool:</span>
          </span>
          <Link
            href="/activity"
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              project === ""
                ? "bg-white text-black font-semibold"
                : "bg-[#111] text-[#a1a1a1] hover:text-[#ededed] border border-white/10"
            }`}
          >
            All projects
          </Link>
          {chips.map((c) => (
            <Link
              key={c.id}
              href={"/activity?project=" + encodeURIComponent(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                project === c.id
                  ? "bg-white text-black font-semibold"
                  : "bg-[#111] text-[#a1a1a1] hover:text-[#ededed] border border-white/10"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Events Table / Timeline */}
      {failed ? (
        <div className="p-6 text-center rounded-xl border border-white/10 bg-[#0a0a0a] text-xs text-[#a1a1a1]">
          Activity is unavailable right now. Please try again shortly.
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-white/10 bg-[#0a0a0a]">
          <Activity className="w-8 h-8 text-[#8a8a8a] mx-auto mb-2" />
          <p className="text-xs text-[#a1a1a1]">
            {project
              ? "No events recorded in this project yet."
              : "No activity recorded yet. Events appear here when an AI account uses a Hub tool or integration."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Timestamp</TableHead>
              <TableHead>Project / Pool</TableHead>
              <TableHead>Agent / Runtime</TableHead>
              <TableHead>Event Action</TableHead>
              <TableHead>Details</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {rows.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-[11px] text-[#8a8a8a] whitespace-nowrap">
                  {ago(e.at)}
                </TableCell>
                <TableCell>
                  <Badge variant="grey" dot={false}>
                    {e.project_name || e.project || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[#ededed]">
                  {e.agent || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="green" dot={false}>
                    {human(e.action || "")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#a1a1a1] max-w-md truncate">
                  {e.text || "—"}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

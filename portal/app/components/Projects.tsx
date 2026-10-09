import { Fragment } from "react";
import Link from "next/link";
import { FolderKanban, Plus, CheckCircle2, AlertCircle, Clock, ChevronDown, Sparkles } from "lucide-react";
import { getProjects } from "../../lib/data";
import { PortalSwitch, ProjectCreate } from "./ProjectActions";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "./ui/Table";

const when = (iso?: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") + " UTC" : "No activity yet");

export default async function Projects({ token }: { token: string }) {
  const d = await getProjects(token).catch(() => null);

  if (!d || !d.ok) {
    return (
      <div className="p-4 rounded-xl bg-[#ff7b7b]/10 border border-[#ff7b7b]/30 text-xs text-[#ff7b7b]">
        Could not load projects. Please try again shortly.
      </div>
    );
  }

  const accts = d.accounts ?? [];

  if (accts.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <FolderKanban className="w-8 h-8 text-[#8a8a8a] mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#ededed]">No AI Accounts Linked Yet</h3>
        <p className="text-xs text-[#a1a1a1] max-w-md mx-auto mt-1 mb-4">
          Link an AI account (Claude / ChatGPT) first to create and view isolated project memory pools.
        </p>
        <Link href="/ai">
          <span className="text-xs text-[#3ecf8e] hover:underline font-semibold">Open AI accounts &rarr;</span>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" pulse>
              ISOLATED MEMORY POOLS
            </Badge>
            <span className="text-xs text-[#8a8a8a]">•</span>
            <span className="text-xs font-mono text-[#8a8a8a]">{accts.length} Accounts</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#ededed] tracking-tight">Projects & Memory Pools</h1>
          <p className="text-xs text-[#a1a1a1] mt-0.5 max-w-2xl">
            Separate memory pools your AI apps can save to. The project marked <strong className="text-[#3ecf8e]">Portal feed</strong> feeds the Overview and Activity tabs.
          </p>
        </div>
      </div>

      {accts.map((a) => {
        const rows = [...a.projects].sort(
          (x, y) =>
            Number(y.is_portal) - Number(x.is_portal) ||
            String(y.updated_at ?? "").localeCompare(String(x.updated_at ?? ""))
        );

        return (
          <Card key={a.id} className="space-y-4">
            {/* Account Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-semibold text-[#ededed]">{a.nickname || a.label}</h2>
                {a.nickname && <span className="text-xs font-mono text-[#8a8a8a]">{a.label}</span>}
              </div>
              {a.ops_project !== "default" && (
                <PortalSwitch hubUser={a.id} project="default" label="Show default pool in portal" ghost />
              )}
            </div>

            {rows.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8a8a8a] bg-[#111] rounded-lg">
                No saved project memory pools for this AI account yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Memories</TableHead>
                    <TableHead className="text-right">Tasks</TableHead>
                    <TableHead className="text-right">Blockers</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </tr>
                </TableHeader>
                <tbody>
                  {rows.map((p) => (
                    <Fragment key={p.id}>
                      <TableRow>
                        <TableCell>
                          <div className="font-semibold text-[#ededed]">{p.name}</div>
                          {p.description && <div className="text-[11px] text-[#8a8a8a]">{p.description}</div>}
                        </TableCell>
                        <TableCell>
                          {p.is_portal ? (
                            <Badge variant="green">Portal Feed</Badge>
                          ) : (
                            <Badge variant="grey" dot={false}>Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{p.counts.memories}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {p.counts.pending_tasks} / {p.counts.tasks}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {p.counts.blockers > 0 ? (
                            <Badge variant="amber">{p.counts.blockers}</Badge>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{p.counts.claims}</TableCell>
                        <TableCell className="font-mono text-[11px] text-[#8a8a8a]">{when(p.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          {p.is_portal ? (
                            <span className="text-xs font-mono text-[#3ecf8e]">Active Feed</span>
                          ) : (
                            <PortalSwitch hubUser={a.id} project={p.id} label="Set Feed" ghost />
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-[#0e0e0e]/50 hover:bg-[#0e0e0e]/50">
                        <TableCell className="p-3" colSpan={8}>
                          <details className="group">
                            <summary className="cursor-pointer text-[11px] font-mono text-[#8a8a8a] hover:text-[#ededed] flex items-center gap-1">
                              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                              <span>Latest Activity Stream ({p.recent.length})</span>
                            </summary>
                            {p.summary && (
                              <p className="mt-2 text-xs text-[#a1a1a1] bg-[#111] p-2.5 rounded border border-white/5">
                                {p.summary}
                              </p>
                            )}
                            {p.recent.length === 0 ? (
                              <p className="mt-2 text-[11px] text-[#707070]">No recent events in this project.</p>
                            ) : (
                              <div className="mt-2 space-y-1">
                                {p.recent.map((e, i) => (
                                  <div
                                    key={i}
                                    className="text-[11px] font-mono flex items-center gap-3 p-1.5 rounded bg-[#111]/80 text-[#a1a1a1]"
                                  >
                                    <span className="text-[#8a8a8a] shrink-0">{when(e.at)}</span>
                                    <span className="text-[#3ecf8e] font-semibold">{e.agent || "AI"}</span>
                                    <span className="text-[#ededed]">{(e.action || "event").replace(/_/g, " ")}</span>
                                    {e.text && <span className="text-[#8a8a8a] truncate">{e.text}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </details>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            )}

            {/* Create Project Footer */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111]/40 p-3 rounded-lg">
              <ProjectCreate hubUser={a.id} />
              <p className="text-[11px] text-[#8a8a8a]">
                Project counts reflect the latest 100 events retained by the Hub.
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

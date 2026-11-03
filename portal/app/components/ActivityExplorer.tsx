"use client";

import { useMemo, useState } from "react";
import { Search, Copy, X, Clock } from "lucide-react";
import { ago, human } from "../../lib/format";

type Ev = {
  at: string;
  agent?: string;
  action?: string;
  text?: string;
  project?: string;
  project_name?: string;
};

export default function ActivityExplorer({ rows }: { rows: Ev[] }) {
  const [q, setQ] = useState("");
  const [agent, setAgent] = useState("all");
  const [sel, setSel] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const agents = useMemo(
    () => Array.from(new Set(rows.map((r) => r.agent || "unknown"))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (agent !== "all" && (r.agent || "unknown") !== agent) return false;
      if (!query) return true;
      const hay = `${r.agent || ""} ${r.action || ""} ${r.text || ""} ${r.project_name || ""} ${r.project || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, agent]);

  const active = sel != null ? filtered[sel] : null;

  async function copyJson() {
    if (!active) return;
    await navigator.clipboard.writeText(JSON.stringify(active, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="activity-explorer space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a988f]" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(null);
            }}
            placeholder="Search agent, action, or text"
            className="h-11 w-full rounded-full border border-[#e7e4dc] bg-white pl-10 pr-4 detail-value text-sm text-zinc-100 outline-none placeholder:text-[#9a988f] focus:border-[#141414]"
          />
        </div>
        <select
          value={agent}
          onChange={(e) => {
            setAgent(e.target.value);
            setSel(null);
          }}
          aria-label="Agent"
          className="h-11 shrink-0 rounded-full border border-[#e7e4dc] bg-white px-4 text-sm text-[#141414] outline-none focus:border-[#141414]"
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-[#9a988f]">
        {filtered.length} of {rows.length} events
      </p>

      <div className="activity-list overflow-hidden rounded-xl border border-white/10 bg-[#101012]">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#6f6e68]">No events match these filters.</p>
        ) : (
          <ul className="divide-y divide-[#e7e4dc]">
            {filtered.map((r, i) => {
              const isActive = sel === i;
              return (
                <li key={`${r.at}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSel(isActive ? null : i)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 ${
                      isActive ? "bg-white/[.07]" : "hover:bg-white/[.035]"
                    }`}
                  >
                    <span className="mt-1.5 flex size-2 shrink-0 rounded-full bg-[#2f6fe0]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-zinc-100">
                          {human(r.action || "event")}
                        </span>
                        <span className="rounded-full bg-white/[.08] px-2 py-0.5 text-[11px] text-zinc-300">
                          {r.agent || "unknown"}
                        </span>
                        {(r.project_name || r.project) && (
                          <span className="text-[11px] text-zinc-500">
                            {r.project_name || r.project}
                          </span>
                        )}
                      </span>
                      {r.text ? (
                        <span className="mt-1 block truncate text-xs text-zinc-400">{r.text}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#9a988f]">
                      <Clock className="h-3 w-3" />
                      {ago(r.at)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {active && (
        <div className="activity-detail fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={() => setSel(null)}>
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101012] text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-base font-semibold text-zinc-100">
                {human(active.action || "event")}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={copyJson}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied" : "JSON"}
                </button>
                <button
                  type="button"
                  onClick={() => setSel(null)}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="detail-card rounded-xl border border-white/10 bg-[#171719] p-3">
                  <p className="detail-label text-[10px] uppercase tracking-wider text-zinc-500">Agent</p>
                  <p className="mt-1 truncate text-sm text-[#141414]">{active.agent || "—"}</p>
                </div>
                <div className="rounded-xl border border-[#e7e4dc] bg-white p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#9a988f]">Pool</p>
                  <p className="mt-1 truncate text-sm text-[#141414]">
                    {active.project_name || active.project || "default"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[#e7e4dc] bg-white p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#9a988f]">Recorded</p>
                <p className="mt-1 font-mono text-xs text-zinc-300">{active.at}</p>
              </div>
              <div className="rounded-xl border border-[#e7e4dc] bg-white p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#9a988f]">Details</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-100 break-words">
                  {active.text || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[#e7e4dc] bg-white p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-[#9a988f]">Payload</p>
                <pre className="max-h-64 overflow-auto rounded-lg bg-[#09090b] p-3 font-mono text-[11px] leading-relaxed text-zinc-200">
                  {JSON.stringify(active, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

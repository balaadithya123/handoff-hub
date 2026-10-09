"use client";

import { useMemo, useState } from "react";
import { Search, RotateCcw, X, Copy } from "lucide-react";

export type Ev = { at: string; agent?: string; action?: string; text?: string; project?: string; project_name?: string };

const human = (s: string) => (s || "event").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(s)) return "";
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  return h < 24 ? h + "h ago" : Math.floor(h / 24) + "d ago";
}

function clock(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(11, 23) : "";
}

function initials(name: string) {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ActivityExplorer({ rows }: { rows: Ev[] }) {
  const [q, setQ] = useState("");
  const [agent, setAgent] = useState("all");
  const [action, setAction] = useState("all");
  const [sel, setSel] = useState<number | null>(rows.length ? 0 : null);
  const [copied, setCopied] = useState(false);

  const agents = useMemo(() => Array.from(new Set(rows.map((r) => r.agent || "unknown"))).sort(), [rows]);
  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action || "event"))).sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => (agent === "all" || (r.agent || "unknown") === agent))
      .filter(({ r }) => (action === "all" || (r.action || "event") === action))
      .filter(({ r }) =>
        !needle ||
        [r.agent, r.action, r.text, r.project, r.project_name].some((v) => (v || "").toLowerCase().includes(needle))
      );
  }, [rows, q, agent, action]);

  const active = sel !== null && rows[sel] ? rows[sel] : null;
  const reset = () => {
    setQ("");
    setAgent("all");
    setAction("all");
  };

  const selectCls =
    "h-10 pl-3 pr-8 rounded-lg bg-[#121212] border border-white/[0.08] text-[13px] text-[#ededed] appearance-none cursor-pointer focus:outline-none focus:border-[#60eca8] transition-colors";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-[#0a0a0a] border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070] pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by agent, action, project or text..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#121212] border border-white/[0.08] text-[13px] text-[#ededed] placeholder:text-[#707070] focus:outline-none focus:border-[#60eca8] transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className={selectCls} aria-label="Agent">
              <option value="all">All agents</option>
              {agents.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={action} onChange={(e) => setAction(e.target.value)} className={selectCls} aria-label="Action">
              <option value="all">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{human(a)}</option>
              ))}
            </select>
            <button
              onClick={reset}
              className="h-10 px-3 rounded-lg bg-[#121212] hover:bg-[#181818] border border-white/[0.08] text-[#707070] hover:text-[#ededed] text-[13px] font-medium transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
        <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2 font-mono text-[11px] text-[#707070]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60eca8] animate-pulse" />
          <span>
            Showing <strong className="text-[#ededed] font-semibold">{filtered.length}</strong> of {rows.length} events
          </span>
        </div>
      </div>

      {/* Master / detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 rounded-xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#121212] border-b border-white/[0.08] font-mono text-[10px] text-[#707070] uppercase tracking-wider select-none">
            <div className="col-span-2">Time</div>
            <div className="col-span-3">Agent</div>
            <div className="col-span-5">Operation</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#a1a1a1]">No events match these filters.</div>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.08]">
              {filtered.map(({ r, i }) => {
                const on = i === sel;
                return (
                  <button
                    key={i}
                    onClick={() => setSel(i)}
                    className={`text-left grid grid-cols-12 gap-2 px-4 py-3 border-l-2 transition-colors ${
                      on ? "bg-[#201f1f]/60 border-[#60eca8]" : "bg-[#0a0a0a] hover:bg-[#121212] border-transparent"
                    }`}
                  >
                    <div className="col-span-12 md:col-span-2 flex md:flex-col justify-center gap-2 md:gap-0">
                      <span className={`font-mono text-[12px] font-semibold ${on ? "text-[#60eca8]" : "text-[#a1a1a1]"}`}>
                        {ago(r.at)}
                      </span>
                      <span className="font-mono text-[10px] text-[#707070]">{clock(r.at)}</span>
                    </div>
                    <div className="col-span-12 md:col-span-3 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-[#1e2922] border border-white/[0.08] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-[#60eca8]">
                        {initials(r.agent || "?")}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[13px] font-medium text-[#ededed] truncate">{r.agent || "—"}</span>
                        <span className="block font-mono text-[10px] text-[#707070] truncate">
                          {r.project_name || r.project || "default pool"}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-5 flex items-center min-w-0">
                      <span className="text-[13px] text-[#ededed] truncate">{r.text || "—"}</span>
                    </div>
                    <div className="col-span-12 md:col-span-2 flex items-center md:justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#60eca8]/10 text-[#60eca8] border border-[#60eca8]/25">
                        {human(r.action || "event")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-4 rounded-xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden lg:sticky lg:top-20">
          {!active ? (
            <div className="p-8 text-center text-[13px] text-[#a1a1a1]">Select an event to inspect it.</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                <span className="font-mono text-[12px] text-[#60eca8]">Event // {human(active.action || "event")}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(active, null, 2)).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      });
                    }}
                    className="px-2 py-1 rounded font-mono text-[11px] text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#121212] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? "Copied" : "JSON"}
                  </button>
                  <button
                    onClick={() => setSel(null)}
                    aria-label="Close"
                    className="p-1 rounded text-[#707070] hover:text-[#ededed] hover:bg-[#121212] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.08] border-b border-white/[0.08]">
                <div className="p-3">
                  <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">Agent</span>
                  <span className="block text-[13px] text-[#ededed] truncate">{active.agent || "—"}</span>
                </div>
                <div className="p-3">
                  <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">Pool</span>
                  <span className="block text-[13px] text-[#ededed] truncate">
                    {active.project_name || active.project || "default"}
                  </span>
                </div>
              </div>
              <div className="p-3 border-b border-white/[0.08]">
                <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider">Recorded at</span>
                <span className="block font-mono text-[12px] text-[#bbcabe]">{active.at}</span>
              </div>
              <div className="p-3 border-b border-white/[0.08]">
                <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider mb-1">Details</span>
                <p className="text-[13px] text-[#ededed] leading-relaxed break-words">{active.text || "—"}</p>
              </div>
              <div className="p-3">
                <span className="block font-mono text-[10px] text-[#707070] uppercase tracking-wider mb-1.5">
                  Payload (read-only)
                </span>
                <pre className="font-mono text-[11px] leading-relaxed text-[#60eca8] bg-[#000] border border-white/[0.08] rounded-lg p-3 overflow-x-auto max-h-72">
                  {JSON.stringify(active, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

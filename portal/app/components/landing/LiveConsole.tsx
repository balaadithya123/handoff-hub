"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Lock } from "lucide-react";

type Cat = "handoffs" | "syncs" | "warnings";
type Status = "completed" | "lock" | "synced" | "verified" | "degraded";

type Ev = {
  id: string;
  time: string;
  actor: string;
  mark: string;
  sub: string;
  op: string;
  target: string;
  ms: number;
  tokens: number;
  status: Status;
  cat: Cat;
  event: string;
  trace: string[];
};

type Template = Omit<Ev, "id" | "time">;

const SEED: Ev[] = [
  {
    id: "hnd-9942", time: "14:32:08.412", actor: "Claude", mark: "C", sub: "Anthropic",
    op: "Handed a task to ChatGPT", target: "agent:chatgpt // project:default",
    ms: 34, tokens: 1420, status: "completed", cat: "handoffs", event: "handoff.task.created",
    trace: ["Context brief written", "Task stored for chatgpt", "Handoff event logged"],
  },
  {
    id: "clm-3048", time: "14:31:55.109", actor: "ChatGPT", mark: "4o", sub: "OpenAI",
    op: "Claimed a file before editing", target: "file:src/billing/stripe.ts",
    ms: 18, tokens: 310, status: "lock", cat: "handoffs", event: "claim.resource.acquired",
    trace: ["Claim requested", "No conflicting claim found", "Advisory lock held"],
  },
  {
    id: "syn-1204", time: "14:30:12.871", actor: "Supabase", mark: "DB", sub: "Account store",
    op: "Saved memory to your account pool", target: "pool:default // 1 row",
    ms: 112, tokens: 0, status: "synced", cat: "syncs", event: "memory.written",
    trace: ["Session verified", "Row upserted", "Read-back confirmed"],
  },
  {
    id: "wh-0982", time: "14:28:44.200", actor: "GitHub", mark: "GH", sub: "Repo access",
    op: "Committed 3 files to main", target: "repo:you/your-repo",
    ms: 42, tokens: 0, status: "verified", cat: "syncs", event: "github.commit.created",
    trace: ["Repo on allowlist", "Tree and commit created", "Branch ref updated"],
  },
  {
    id: "wrn-0014", time: "14:26:10.054", actor: "Notion", mark: "N", sub: "Provider token",
    op: "Token refresh needed, reconnect to continue", target: "provider:notion",
    ms: 480, tokens: 0, status: "degraded", cat: "warnings", event: "provider.token.expired",
    trace: ["Call attempted", "Provider rejected token", "Marked for reconnect"],
  },
];

const POOL: Template[] = [
  {
    actor: "Claude", mark: "C", sub: "Anthropic", op: "Read the latest context brief", target: "tool:handoff_brief",
    ms: 22, tokens: 860, status: "completed", cat: "handoffs", event: "brief.read",
    trace: ["Session verified", "Brief assembled", "Returned to claude"],
  },
  {
    actor: "Vercel", mark: "V", sub: "Deployments", op: "Deployment reached READY", target: "project:your-app // production",
    ms: 64, tokens: 0, status: "verified", cat: "syncs", event: "vercel.deployment.ready",
    trace: ["Build started", "Build finished", "Alias assigned"],
  },
  {
    actor: "ChatGPT", mark: "4o", sub: "OpenAI", op: "Completed a handed-off task", target: "agent:claude // result stored",
    ms: 29, tokens: 540, status: "completed", cat: "handoffs", event: "handoff.task.completed",
    trace: ["Task picked up", "Result written", "Claude notified"],
  },
  {
    actor: "Supabase", mark: "DB", sub: "Account store", op: "Saved memory to your account pool", target: "pool:default // 2 rows",
    ms: 97, tokens: 0, status: "synced", cat: "syncs", event: "memory.written",
    trace: ["Session verified", "Rows upserted", "Read-back confirmed"],
  },
  {
    actor: "Claude", mark: "C", sub: "Anthropic", op: "Claimed a deployment before redeploying", target: "project:your-app",
    ms: 15, tokens: 120, status: "lock", cat: "handoffs", event: "claim.resource.acquired",
    trace: ["Claim requested", "No conflicting claim found", "Advisory lock held"],
  },
];

const PILL: Record<Status, { cls: string; label: string }> = {
  completed: { cls: "bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/25", label: "Completed" },
  verified: { cls: "bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/25", label: "Verified" },
  lock: { cls: "bg-[#4ddcc6]/10 text-[#4ddcc6] border-[#4ddcc6]/25", label: "Lock active" },
  synced: { cls: "bg-white/[0.04] text-[#a1a1a1] border-white/[0.08]", label: "Synced" },
  degraded: { cls: "bg-[#f5b14a]/10 text-[#f5b14a] border-[#f5b14a]/25", label: "Degraded" },
};

const CATS: { key: "all" | Cat; label: string }[] = [
  { key: "all", label: "All events" },
  { key: "handoffs", label: "AI claims & handoffs" },
  { key: "syncs", label: "Provider syncs" },
  { key: "warnings", label: "Warnings" },
];

const MAX_ROWS = 6;

function stamp() {
  const d = new Date();
  return `${d.toLocaleTimeString("en-GB", { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function corr(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return "corr_" + h.toString(16).padStart(8, "0") + "9a";
}

function payloadOf(e: Ev) {
  return {
    event: e.event,
    actor: { id: e.actor.toLowerCase(), type: e.cat === "syncs" ? "provider" : "ai_agent" },
    target: e.target,
    telemetry: { response_time_ms: e.ms, tokens_evaluated: e.tokens },
  };
}

function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2);
  const parts: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|([{}[\],:])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      parts.push(<span key={k++} className="text-[#4ddcc6]">{m[1]}</span>);
      parts.push(<span key={k++} className="text-[#707070]">{m[2]}</span>);
    } else if (m[1]) parts.push(<span key={k++} className="text-[#60eca8]">{m[1]}</span>);
    else if (m[3]) parts.push(<span key={k++} className="text-[#f5b14a]">{m[3]}</span>);
    else parts.push(<span key={k++} className="text-[#707070]">{m[4]}</span>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function LiveConsole() {
  const [rows, setRows] = useState<Ev[]>(SEED);
  const [fresh, setFresh] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | Cat>("all");
  const [live, setLive] = useState(true);
  const [pinned, setPinned] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      const tpl = POOL[counter.current % POOL.length];
      counter.current += 1;
      const prefix = tpl.cat === "handoffs" ? (tpl.status === "lock" ? "clm" : "hnd") : tpl.cat === "syncs" ? "syn" : "wrn";
      const id = `${prefix}-${String(9943 + counter.current).padStart(4, "0")}`;
      setRows((r) => [{ ...tpl, id, time: stamp() }, ...r].slice(0, MAX_ROWS));
      setFresh(id);
    }, 3400);
    return () => clearInterval(t);
  }, [live]);

  const visible = useMemo(() => rows.filter((r) => cat === "all" || r.cat === cat), [rows, cat]);
  const selected = visible.find((r) => r.id === pinned) ?? visible[0];
  const counts = (k: "all" | Cat) => (k === "all" ? rows.length : rows.filter((r) => r.cat === k).length);

  const copy = () => {
    if (!selected) return;
    navigator.clipboard
      ?.writeText(JSON.stringify(payloadOf(selected), null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <div className="space-y-3">
      <div className="spot p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Event categories">
          {CATS.map((c) => {
            const on = cat === c.key;
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={on}
                onClick={() => setCat(c.key)}
                className={`px-2.5 py-1 rounded-md text-[13px] font-medium border flex items-center gap-1.5 transition-all ${
                  on
                    ? "bg-[#201f1f] text-[#ededed] border-white/[0.16]"
                    : "text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#121212] border-transparent"
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 rounded ${
                    c.key === "warnings" ? "text-[#f5b14a] bg-[#f5b14a]/10" : "text-[#707070] bg-black/40"
                  }`}
                >
                  {counts(c.key)}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          className="btn-press self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/[0.08] hover:border-white/[0.16] text-[#ededed] text-[13px] font-medium"
          aria-pressed={live}
        >
          {live ? (
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#3ecf8e] opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[#3ecf8e]" />
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#707070]" />
          )}
          <span>{live ? "Live stream" : "Paused"}</span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              live ? "text-[#3ecf8e] bg-[#3ecf8e]/10 border-[#3ecf8e]/20" : "text-[#707070] bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            {live ? "PAUSE" : "RESUME"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 spot overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#121212] border-b border-white/[0.08] font-mono text-[10px] text-[#707070] uppercase tracking-wider select-none">
            <div className="col-span-2">ID / time</div>
            <div className="col-span-3">Actor / provider</div>
            <div className="col-span-4">Operation &amp; target</div>
            <div className="col-span-1 text-right">Latency</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {visible.length === 0 && (
              <p className="px-4 py-10 text-center text-[13px] text-[#707070]">No events in this category yet.</p>
            )}
            {visible.map((r) => {
              const on = selected?.id === r.id;
              const p = PILL[r.status];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPinned(r.id)}
                  aria-current={on}
                  className={`${r.id === fresh ? "row-in" : ""} w-full text-left grid grid-cols-12 gap-x-2 gap-y-1.5 px-4 py-3 border-l-2 transition-colors ${
                    on ? "bg-[#201f1f]/60 border-[#3ecf8e]" : "bg-[#0a0a0a] hover:bg-[#121212] border-transparent"
                  }`}
                >
                  <div className="col-span-4 lg:col-span-2 flex flex-col justify-center min-w-0">
                    <span
                      className={`font-mono text-[11px] font-semibold truncate ${
                        r.status === "degraded" ? "text-[#f5b14a]" : on ? "text-[#3ecf8e]" : "text-[#a1a1a1]"
                      }`}
                    >
                      #{r.id}
                    </span>
                    <span className="font-mono text-[10px] text-[#707070]">{r.time}</span>
                  </div>
                  <div className="col-span-4 lg:col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-[#1c1b1b] border border-white/[0.08] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-[#3ecf8e]">
                      {r.mark}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[13px] font-medium text-[#ededed] truncate">{r.actor}</span>
                      <span className="block font-mono text-[10px] text-[#707070] truncate">{r.sub}</span>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 order-last lg:order-none flex flex-col justify-center min-w-0">
                    <span className="text-[13px] text-[#ededed] truncate">{r.op}</span>
                    <span className="font-mono text-[11px] text-[#707070] truncate">{r.target}</span>
                  </div>
                  <div
                    className={`hidden lg:flex col-span-1 items-center justify-end font-mono text-[11px] ${
                      r.status === "degraded" ? "text-[#f5b14a]" : "text-[#a1a1a1]"
                    }`}
                  >
                    {r.ms}ms
                  </div>
                  <div className="col-span-4 lg:col-span-2 flex items-center justify-end">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] border ${p.cls}`}>
                      {r.status === "lock" ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : r.status === "verified" ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full bg-current ${r.status === "completed" ? "animate-pulse" : ""}`} />
                      )}
                      {p.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2.5 bg-[#121212] border-t border-white/[0.08] font-mono text-[11px] text-[#707070]">
            Sample events. Your own activity appears here after you sign in.
          </div>
        </div>

        <div className="lg:col-span-4 spot overflow-hidden lg:sticky lg:top-20">
          {selected ? (
            <div key={selected.id} className="fade-in">
              <div className="flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#3ecf8e] shrink-0" />
                  <span className="font-mono text-[12px] font-semibold text-[#ededed] truncate">Event // #{selected.id}</span>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1 px-1.5 py-1 rounded font-mono text-[11px] text-[#707070] hover:text-[#ededed] hover:bg-[#0a0a0a] transition-colors"
                  title="Copy payload as JSON"
                >
                  {copied ? <Check className="w-3 h-3 text-[#3ecf8e]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "JSON"}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.08] bg-[#0e0e0e]/50 border-b border-white/[0.08]">
                <Metric label="Trigger" value={selected.event} />
                <Metric label="Correlation ID" value={corr(selected.id)} mono accent />
                <Metric label="Execution time" value={`${selected.ms} ms`} mono />
                <Metric label="Context ingested" value={`${selected.tokens.toLocaleString("en-US")} tokens`} mono />
              </div>
              <div className="p-3.5 border-b border-white/[0.08]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-[#707070] uppercase tracking-wider">Trace</span>
                  <span className={`font-mono text-[10px] ${selected.status === "degraded" ? "text-[#f5b14a]" : "text-[#3ecf8e]"}`}>
                    {selected.status === "degraded" ? "2 / 3 stages ok" : "3 / 3 stages ok"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 font-mono text-[11px]">
                  {selected.trace.map((t, i) => (
                    <div key={t} className="step-in flex items-start gap-2" style={{ animationDelay: `${i * 90}ms` }}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          selected.status === "degraded" && i === 2 ? "bg-[#f5b14a]" : "bg-[#3ecf8e]"
                        }`}
                      />
                      <span className="text-[#ededed]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#050505]">
                <div className="px-3.5 py-2 bg-[#121212]/80 border-b border-white/[0.08] font-mono text-[10px] text-[#707070] uppercase tracking-wider">
                  Payload snapshot
                </div>
                <pre className="m-0 p-3.5 font-mono text-[12px] leading-relaxed overflow-x-auto max-h-[300px]">
                  <Json value={payloadOf(selected)} />
                </pre>
              </div>
            </div>
          ) : (
            <p className="p-6 text-[13px] text-[#707070]">Select an event to inspect it.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="p-3 flex flex-col gap-0.5 min-w-0">
      <span className="font-mono text-[10px] text-[#707070] uppercase">{label}</span>
      <span
        className={`truncate ${mono ? "font-mono text-[11px]" : "text-[13px] font-medium"} ${
          accent ? "text-[#3ecf8e]" : "text-[#ededed]"
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

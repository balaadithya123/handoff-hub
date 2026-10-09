"use client";

import { useState } from "react";
import { Plus, X, Shield, AlertCircle } from "lucide-react";

type Kind = "github" | "vercel";

/** Add / remove Vercel project ids and GitHub repos the Hub is allowed to act on. */
export default function AllowlistEditor({
  hubId,
  kind,
  initial,
}: {
  hubId: string;
  kind: Kind;
  initial: string[];
}) {
  const [list, setList] = useState<string[]>(initial);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const hint = kind === "github" ? "owner/repository" : "prj_12345";
  const title = kind === "github" ? "GitHub Repositories" : "Vercel Projects";

  async function run(action: "add" | "remove", v: string) {
    if (busy || !v.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hubId, kind, action, value: v.trim() }),
      }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : {};
      setBusy(false);
      if (r && r.ok) {
        setList(d.list ?? []);
        if (action === "add") setValue("");
      } else {
        setErr(d?.error || "Could not update allowlist.");
      }
    } catch {
      setErr("Network error updating allowlist.");
      setBusy(false);
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#ededed] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#3ecf8e]" />
          <span>{title}</span>
        </h4>
        <span className="text-[10px] font-mono text-[#8a8a8a]">{list.length} allowed</span>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-[#8a8a8a]">No items allowed yet. Add an entry below.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {list.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111] border border-white/10 text-xs font-mono text-[#ededed]"
            >
              <span>{v}</span>
              <button
                type="button"
                aria-label={"Remove " + v}
                onClick={() => run("remove", v)}
                disabled={busy}
                className="text-[#8a8a8a] hover:text-[#ff7b7b] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          value={value}
          placeholder={hint}
          aria-label={"Add " + kind}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run("add", value);
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-[#111] border border-white/10 text-xs text-[#ededed] placeholder-[#707070] focus:outline-none focus:border-[#3ecf8e] flex-1 font-mono"
        />
        <button
          type="button"
          onClick={() => run("add", value)}
          disabled={busy || !value.trim()}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{busy ? "Saving…" : "Add"}</span>
        </button>
      </div>

      {err && (
        <div className="flex items-center gap-1 text-xs text-[#ff7b7b]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}
    </div>
  );
}

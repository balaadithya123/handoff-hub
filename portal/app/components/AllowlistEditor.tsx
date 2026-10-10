"use client";

import { useState } from "react";
import { Plus, X, Shield, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

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
    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/8 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#ededed] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#3ecf8e]" />
          <span>{title}</span>
        </h4>
        <span className="text-[10px] font-mono text-[#707070]">{list.length} allowed</span>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-[#707070]">No items allowed yet. Add an entry below.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {list.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121212] border border-white/8 text-xs font-mono text-[#ededed]"
            >
              <span>{v}</span>
              <button
                type="button"
                aria-label={"Remove " + v}
                onClick={() => run("remove", v)}
                disabled={busy}
                className="text-[#707070] hover:text-[#ff7b7b] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Input
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
          className="flex-1 font-mono text-xs"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => run("add", value)}
          loading={busy}
          disabled={busy || !value.trim()}
          icon={<Plus className="w-3.5 h-3.5" />}
          className="shrink-0 h-9"
        >
          {busy ? "Saving…" : "Add"}
        </Button>
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

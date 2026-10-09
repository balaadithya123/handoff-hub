"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { X } from "lucide-react";

type Kind = "github" | "vercel";

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

  async function run(action: "add" | "remove", v: string) {
    if (busy || !v.trim()) return;
    setBusy(true);
    setErr("");
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
      setErr(d?.error || "Could not update.");
    }
  }

  return (
    <div className="p-3.5 rounded-lg bg-[#111] border border-white/10 space-y-3">
      <h3 className="text-xs font-semibold text-[#ededed]">
        {kind === "github" ? "GitHub Repositories Allowlist" : "Vercel Projects Allowlist"}
      </h3>

      {list.length === 0 ? (
        <p className="text-xs text-[#8a8a8a]">None allowed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#ededed]"
            >
              <span>{v}</span>
              <button
                type="button"
                aria-label={"Remove " + v}
                onClick={() => run("remove", v)}
                disabled={busy}
                className="hover:text-[#ff7b7b] transition-colors p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 max-w-md">
        <Input
          value={value}
          placeholder={hint}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run("add", value);
            }
          }}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => run("add", value)}
          loading={busy}
          disabled={busy || !value.trim()}
        >
          Add
        </Button>
      </div>
      {err && <p className="text-xs text-[#ff7b7b]">{err}</p>}
    </div>
  );
}

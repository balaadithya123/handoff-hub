"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRightLeft, AlertCircle } from "lucide-react";

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; error: string }> {
  const r = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const d = r ? await r.json().catch(() => ({})) : {};
  return {
    ok: Boolean(r && r.ok),
    error: (d && typeof d.error === "string" && d.error) || "Something went wrong. Try again.",
  };
}

/** Makes one project the feed that portal Overview and Activity read. */
export function PortalSwitch({
  hubUser,
  project,
  label,
  ghost,
}: {
  hubUser: string;
  project: string;
  label: string;
  ghost?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await call({ action: "set_portal", hub_user: hubUser, project });
    setBusy(false);
    if (r.ok) {
      router.refresh();
    } else {
      setErr(r.error);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
          ghost
            ? "bg-[#111] hover:bg-white/10 text-[#a1a1a1] hover:text-[#ededed] border border-white/10"
            : "bg-[#3ecf8e] text-black hover:bg-[#6ee7b7] font-semibold shadow-sm"
        }`}
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>{busy ? "Switching…" : label}</span>
      </button>
      {err && <span className="text-[11px] text-[#ff7b7b]">{err}</span>}
    </div>
  );
}

/** Creates a new, empty project (a separate memory pool) for one AI account. */
export function ProjectCreate({ hubUser }: { hubUser: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (busy || name.trim() === "") return;
    setBusy(true);
    setErr("");
    const r = await call({ action: "create", hub_user: hubUser, name, description });
    setBusy(false);
    if (r.ok) {
      setName("");
      setDescription("");
      router.refresh();
    } else {
      setErr(r.error);
    }
  }

  return (
    <div className="space-y-2 w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          value={name}
          maxLength={80}
          placeholder="New project name"
          aria-label="New project name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-[#ededed] placeholder-[#707070] focus:outline-none focus:border-[#3ecf8e] sm:w-48"
        />
        <input
          value={description}
          maxLength={300}
          placeholder="Description (optional)"
          aria-label="Project description"
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-[#ededed] placeholder-[#707070] focus:outline-none focus:border-[#3ecf8e] flex-1"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || name.trim() === ""}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{busy ? "Creating…" : "Create pool"}</span>
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

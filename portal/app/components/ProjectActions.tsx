"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; error: string }> {
  const r = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const d = r ? await r.json().catch(() => ({})) : {};
  return {
    ok: !!r && r.ok,
    error: (d && typeof d.error === "string" && d.error) || "Something went wrong. Try again.",
  };
}

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
    if (r.ok) router.refresh();
    else setErr(r.error);
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button variant={ghost ? "ghost" : "primary"} size="sm" onClick={go} loading={busy}>
        {busy ? "Switching…" : label}
      </Button>
      {err && <span className="text-[10px] text-[#ff7b7b]">{err}</span>}
    </span>
  );
}

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
    <div className="space-y-2 w-full max-w-xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="w-48">
          <Input
            value={name}
            maxLength={80}
            placeholder="New project name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <div className="flex-1">
          <Input
            value={description}
            maxLength={300}
            placeholder="Description (optional)"
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <Button variant="primary" size="sm" onClick={submit} loading={busy} disabled={busy || name.trim() === ""}>
          Create Project
        </Button>
      </div>
      {err && <p className="text-xs text-[#ff7b7b]">{err}</p>}
    </div>
  );
}

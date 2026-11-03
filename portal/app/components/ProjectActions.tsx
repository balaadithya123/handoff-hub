"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRightLeft, AlertCircle } from "lucide-react";

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; error: string }> {
  const response = await fetch("/api/projects", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { ok: Boolean(response && response.ok), error: typeof data?.error === "string" ? data.error : "Something went wrong. Try again." };
}

export function PortalSwitch({ hubUser, project, label, ghost }: {
  hubUser: string; project: string; label: string; ghost?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    if (busy) return;
    setBusy(true); setError("");
    const result = await call({ action: "set_portal", hub_user: hubUser, project });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={go} disabled={busy}
        className={`axon-action-button ${ghost ? "" : "primary"}`}>
        <ArrowRightLeft size={13} />{busy ? "Switching…" : label}
      </button>
      {error && <span className="text-[11px] text-red-300">{error}</span>}
    </div>
  );
}

export function ProjectCreate({ hubUser }: { hubUser: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy || !name.trim()) return;
    setBusy(true); setError("");
    const result = await call({ action: "create", hub_user: hubUser, name: name.trim(), description: description.trim() });
    setBusy(false);
    if (result.ok) { setName(""); setDescription(""); router.refresh(); }
    else setError(result.error);
  }

  return (
    <div className="axon-project-create-form">
      <input value={name} maxLength={80} placeholder="Project name" aria-label="New project name"
        onChange={event => setName(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); submit(); } }}
      />
      <input value={description} maxLength={300} placeholder="Short description (optional)" aria-label="Project description"
        onChange={event => setDescription(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); submit(); } }}
      />
      <button type="button" className="axon-action-button primary" onClick={submit} disabled={busy || !name.trim()}>
        <Plus size={14} />{busy ? "Creating…" : "Create pool"}
      </button>
      {error && <p className="axon-inline-error"><AlertCircle size={13} />{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRightLeft, AlertCircle, Archive, RotateCcw } from "lucide-react";

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


export function ProjectArchiveButton({ hubUser, project, isPortal = false }: {
  hubUser: string; project: string; isPortal?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function archive() {
    if (busy || isPortal || project === "default") return;
    const confirmed = window.confirm("Archive this project pool? Its memories and activity will be kept, and you can restore it later.");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    const result = await call({ action: "archive", hub_user: hubUser, project });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={archive} disabled={busy || isPortal || project === "default"}
        title={isPortal ? "Choose another portal feed before archiving this pool" : "Archive this project pool"}
        className="axon-archive-button">
        <Archive size={13} />{busy ? "Archiving…" : "Archive"}
      </button>
      {error && <span className="text-[11px] text-red-300">{error}</span>}
    </div>
  );
}

export function ProjectRestoreButton({ hubUser, project }: { hubUser: string; project: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function restore() {
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await call({ action: "restore", hub_user: hubUser, project });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={restore} disabled={busy} className="axon-restore-button">
        <RotateCcw size={13} />{busy ? "Restoring…" : "Restore"}
      </button>
      {error && <span className="text-[11px] text-red-300">{error}</span>}
    </div>
  );
}

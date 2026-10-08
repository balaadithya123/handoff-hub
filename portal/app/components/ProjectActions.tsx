"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function call(body: Record<string, unknown>): Promise<{ ok: boolean; error: string }> {
  const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const d = r ? await r.json().catch(() => ({})) : {};
  return { ok: !!r && r.ok, error: (d && typeof d.error === "string" && d.error) || "Something went wrong. Try again." };
}

/** Makes one project the one the portal Overview and Activity read. */
export function PortalSwitch({ hubUser, project, label, ghost }: { hubUser: string; project: string; label: string; ghost?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await call({ action: "set_portal", hub_user: hubUser, project });
    setBusy(false);
    if (r.ok) router.refresh(); else setErr(r.error);
  }
  return (
    <span>
      <button type="button" className={"shBtn" + (ghost ? " ghost" : "")} onClick={go} disabled={busy}>{busy ? "Switching…" : label}</button>
      {err && <span className="shErr" role="alert" style={{ display: "block" }}>{err}</span>}
    </span>
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
    if (r.ok) { setName(""); setDescription(""); router.refresh(); } else setErr(r.error);
  }
  return (
    <div className="prCreate">
      <div className="shField">
        <input value={name} maxLength={80} placeholder="New project name" aria-label="New project name" onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} />
        <input value={description} maxLength={300} placeholder="Description (optional)" aria-label="Project description" onChange={e => setDescription(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} className="prWide" />
        <button type="button" className="shBtn" onClick={submit} disabled={busy || name.trim() === ""}>{busy ? "Creating…" : "Create project"}</button>
      </div>
      {err && <p className="shErr" role="alert">{err}</p>}
    </div>
  );
}

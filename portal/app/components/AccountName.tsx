"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX = 40;

/** Shows an AI account's name. The original name is fixed; the nickname is an optional label for identification. */
export default function AccountName({ id, label, nickname }: { id: string; label: string; nickname: string | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function start() { setValue(saved ?? ""); setErr(""); setEditing(true); }
  function cancel() { setEditing(false); setErr(""); }
  async function save() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nickname: value.trim() === "" ? null : value }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r && r.ok) { setSaved(d.nickname ?? null); setEditing(false); router.refresh(); }
    else setErr(d?.error || "Could not save the name.");
  }

  if (editing) {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input
            autoFocus
            value={value}
            maxLength={MAX}
            aria-label={"Name for " + label}
            placeholder={label}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } else if (e.key === "Escape") cancel(); }}
            style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", font: "inherit", fontSize: 13, background: "var(--surface)", color: "var(--ink)", minWidth: 160, maxWidth: "100%" }}
          />
          <button type="button" className="shBtn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" className="shBtn ghost" onClick={cancel} disabled={busy}>Cancel</button>
        </div>
        <div className="shMuted" style={{ fontSize: 11, marginTop: 4 }}>Original name: {label} (cannot be changed). Leave empty to remove the nickname.</div>
        {err && <p className="shErr" role="alert">{err}</p>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <b>{saved || label}</b>
        <button type="button" className="shBtn ghost" onClick={start} aria-label={"Edit name for " + label}>Edit</button>
      </div>
      {saved && <div className="shMuted" style={{ fontSize: 11, marginTop: 2 }}>{label}</div>}
    </div>
  );
}

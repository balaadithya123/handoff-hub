"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";

const MAX = 40;

export default function AccountName({ id, label, nickname }: { id: string; label: string; nickname: string | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (busy) return;
    setBusy(true); setError("");
    const response = await fetch("/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nickname: value.trim() || null }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    setBusy(false);
    if (response?.ok) { setSaved(data.nickname ?? null); setEditing(false); router.refresh(); }
    else setError(data?.error || "Could not save this account label.");
  }

  return (
    <div className="axon-account-name-control">
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus value={value} maxLength={MAX}
            aria-label={"Nickname for " + label} placeholder={label}
            onChange={event => setValue(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") { event.preventDefault(); save(); }
              if (event.key === "Escape") { setEditing(false); setError(""); }
            }}
            className="axon-inline-input"
          />
          <button type="button" className="axon-action-button primary" onClick={save} disabled={busy}><Check size={13} />{busy ? "Saving…" : "Save"}</button>
          <button type="button" className="axon-action-button" onClick={() => { setEditing(false); setError(""); }} disabled={busy}><X size={13} />Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <strong>{saved || label}</strong>
          <button type="button" className="axon-action-button" onClick={() => { setValue(saved ?? ""); setError(""); setEditing(true); }}><Pencil size={13} />Edit label</button>
          {saved && <small>Original: {label}</small>}
        </div>
      )}
      {error && <p className="axon-inline-error" role="alert">{error}</p>}
    </div>
  );
}

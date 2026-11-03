"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Clock3, Pencil, Unplug, X } from "lucide-react";

const MAX = 40;
type Props = {
  hub: string; clientId: string; name: string; nickname: string | null;
  active: boolean; lastText: string; connectedText: string;
};
type Out = { ok: boolean; d: { error?: string; nickname?: string | null } };

export default function AiClientCard({ hub, clientId, name, nickname, active, lastText, connectedText }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(body: Record<string, unknown>): Promise<Out> {
    const response = await fetch("/api/ai-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub, client: clientId, ...body }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    return { ok: Boolean(response && response.ok), d: result };
  }

  async function save() {
    if (busy) return;
    setBusy(true); setError("");
    const result = await call({ action: "rename", nickname: value.trim() || null });
    setBusy(false);
    if (result.ok) { setSaved(result.d.nickname ?? null); setEditing(false); router.refresh(); }
    else setError(result.d.error || "Could not save the client name.");
  }

  async function unlink() {
    if (busy) return;
    setBusy(true); setError("");
    const result = await call({ action: "unlink" });
    if (result.ok) { router.refresh(); return; }
    setError(result.d.error || "Could not unlink this client.");
    setBusy(false);
  }

  const shown = saved || name;
  const initial = shown.trim().charAt(0).toUpperCase() || "A";

  return (
    <article className="axon-ai-client">
      <div className="axon-ai-client-main">
        <span className="axon-ai-client-initial">{initial}</span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus value={value} maxLength={MAX}
              aria-label={"Nickname for " + name} placeholder={name}
              onChange={event => setValue(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") { event.preventDefault(); save(); }
                if (event.key === "Escape") { setEditing(false); setError(""); }
              }}
              className="axon-inline-input"
            />
          ) : <h4>{shown}</h4>}
          <p>{saved ? name + " · " : ""}Client ID ···{clientId.slice(-4)}</p>
        </div>
        <span className={`axon-status-chip ${active ? "success" : "neutral"}`}><span />{active ? "Active" : "Idle"}</span>
      </div>

      <div className="axon-ai-client-meta">
        <span><Clock3 size={13} /><small>Last active</small><strong>{lastText}</strong></span>
        <span><Check size={13} /><small>Connected</small><strong>{connectedText}</strong></span>
      </div>

      {confirming ? (
        <div className="axon-inline-confirm">
          <p>Unlink <strong>{shown}</strong>? Other AI clients will remain connected.</p>
          <div>
            <button type="button" className="axon-action-button danger" onClick={unlink} disabled={busy}>{busy ? "Unlinking…" : "Confirm unlink"}</button>
            <button type="button" className="axon-action-button" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : editing ? (
        <div className="axon-ai-client-actions">
          <button type="button" className="axon-action-button primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save name"}</button>
          <button type="button" className="axon-action-button" onClick={() => { setEditing(false); setError(""); }} disabled={busy}>Cancel</button>
        </div>
      ) : (
        <div className="axon-ai-client-actions">
          <button type="button" className="axon-action-button" onClick={() => { setValue(saved ?? ""); setError(""); setEditing(true); }}><Pencil size={13} />Rename</button>
          <button type="button" className="axon-action-button danger" onClick={() => { setError(""); setConfirming(true); }}><Unplug size={13} />Unlink</button>
        </div>
      )}
      {error && <p className="axon-inline-error" role="alert">{error}</p>}
    </article>
  );
}

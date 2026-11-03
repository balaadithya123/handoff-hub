"use client";

import { useState } from "react";
import { Unplug } from "lucide-react";

export default function UnlinkButton({ id, name }: { id: string; name?: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlink() {
    if (busy) return;
    setBusy(true); setError("");
    const response = await fetch("/api/unlink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (response?.ok) { window.location.reload(); return; }
    const data = response ? await response.json().catch(() => ({})) : {};
    setError(data?.error || "Could not unlink this account.");
    setBusy(false);
  }

  if (!asking) {
    return <button type="button" className="axon-action-button danger" onClick={() => { setError(""); setAsking(true); }}><Unplug size={13} />Unlink account</button>;
  }

  return (
    <div className="axon-unlink-confirm">
      <p>Unlink <strong>{name || "this AI account"}</strong>? Its clients will stop using your connections. Other Hub accounts are unaffected.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="axon-action-button danger" onClick={unlink} disabled={busy}>{busy ? "Unlinking…" : "Confirm unlink"}</button>
        <button type="button" className="axon-action-button" onClick={() => setAsking(false)} disabled={busy}>Cancel</button>
      </div>
      {error && <p className="axon-inline-error" role="alert">{error}</p>}
    </div>
  );
}

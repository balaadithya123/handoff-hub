"use client";

import { useState } from "react";
import { Check, Unplug } from "lucide-react";

export default function ConnectionButton({
  provider, connected, available = true, state, reason,
}: {
  provider: string;
  connected: boolean;
  available?: boolean;
  state?: "ready" | "needs_app" | "unavailable" | "unknown";
  reason?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!available) return <span className="plugin-status-soon">Coming soon</span>;
  if (!connected && (state === "needs_app" || state === "unavailable")) {
    return <span title={reason ?? undefined} className="plugin-status-soon">{state === "needs_app" ? "Setup needed" : "Unavailable"}</span>;
  }

  if (!connected) {
    return <a href={`/api/connect/${provider}`} className="plugin-connect-button">Connect</a>;
  }

  async function disconnect() {
    if (busy) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/disconnect/${provider}`, { method: "POST" }).catch(() => null);
    if (response?.ok) { window.location.reload(); return; }
    setError("Could not disconnect.");
    setBusy(false);
  }

  return (
    <div className="plugin-connected-control">
      <button type="button" onClick={disconnect} disabled={busy} className="plugin-connected-button">
        <Check size={13} />{busy ? "Removing…" : "Connected"}
        <Unplug size={12} className="plugin-disconnect-icon" />
      </button>
      {error && <small>{error}</small>}
    </div>
  );
}

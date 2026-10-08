"use client";
import { useState } from "react";

/** Unlink one AI account. Uses an inline confirm (window.confirm is blocked in some browsers/webviews and made the button look dead). */
export default function UnlinkButton({ id, name }: { id: string; name?: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/unlink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    if (r && r.ok) { window.location.reload(); return; }
    const d = r ? await r.json().catch(() => ({})) : {};
    setErr(d?.error || "Could not unlink. Try again.");
    setBusy(false);
  }
  if (!asking) {
    return <button type="button" className="shBtn ghost" onClick={() => { setErr(""); setAsking(true); }}>Unlink</button>;
  }
  const who = name ? "\"" + name + "\"" : "this AI account";
  return (
    <div style={{ minWidth: 220 }}>
      <p className="shMuted" style={{ margin: "0 0 6px" }}>Unlink {who}? It will stop using your connections. Your other accounts are not affected.</p>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" className="shBtn" onClick={go} disabled={busy}>{busy ? "Unlinking…" : "Yes, unlink"}</button>
        <button type="button" className="shBtn ghost" onClick={() => setAsking(false)} disabled={busy}>Cancel</button>
      </div>
      {err && <p className="shErr" role="alert">{err}</p>}
    </div>
  );
}

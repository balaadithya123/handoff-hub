"use client";
import { useState } from "react";

export default function LinkCodeButton({ linked, needsUnlock = false }: { linked: boolean; needsUnlock?: boolean }) {
  const [code, setCode] = useState("");
  const [unlock, setUnlock] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function make() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/link-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ unlock }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error || "Could not create a code.");
      else setCode(d.code);
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }
  if (code) {
    return (
      <div>
        <div className="shBigCode">{code}</div>
        <p className="shMuted">In that AI account, say: <b>Call link_portal_account with code {code}</b>. The code works once and expires in 10 minutes.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="shField">
        {needsUnlock && <input type="password" inputMode="numeric" placeholder="Unlock code" value={unlock} onChange={e => setUnlock(e.target.value)} aria-label="Unlock code" />}
        <button type="button" className="shBtn" onClick={make} disabled={busy || (needsUnlock && !unlock.trim())}>{busy ? "Creating\u2026" : linked ? "Add another AI account" : "Create link code"}</button>
      </div>
      {error && <p className="shErr">{error}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";

export default function LinkCodeButton({ linked }: { linked: boolean }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function make() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/link-code", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error || "Could not create a code.");
      else setCode(d.code);
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }
  return (
    <div className="linkBox">
      {code ? (
        <>
          <div className="linkCode">{code}</div>
          <p>Tell any connected AI: <b>“Call link_portal_account with code {code}”</b>. The code works once and expires in 10 minutes.</p>
        </>
      ) : (
        <button type="button" className="connect" onClick={make} disabled={busy}>
          {busy ? "Creating…" : linked ? "Create a new link code" : "Create link code"}
        </button>
      )}
      {error && <p className="linkErr">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";

export default function LinkCodeButton({ linked, needsUnlock = false }: { linked: boolean; needsUnlock?: boolean }) {
  const [code, setCode] = useState("");
  const [unlock, setUnlock] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function make() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/link-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.error || "Could not create a link code.");
      else setCode(data.code);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code || !navigator.clipboard) return;
    try { await navigator.clipboard.writeText(code); setCopied(true); }
    catch { setError("Copy failed. Select the code to copy it manually."); }
  }

  return (
    <div className="axon-link-code-control">
      {code ? (
        <div className="axon-generated-code">
          <span className="axon-field-label">Your one-time link code</span>
          <div><code>{code}</code><button type="button" className="axon-action-button" onClick={copyCode}><Copy size={13} />{copied ? "Copied" : "Copy"}</button></div>
          <p>In the new AI client, ask it to call <strong>link_portal_account</strong> with this code. It expires in 10 minutes and works once.</p>
          <button type="button" className="axon-text-button" onClick={() => { setCode(""); setCopied(false); }}><RefreshCw size={13} />Generate another code</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          {needsUnlock && (
            <label className="axon-unlock-field">
              <span className="axon-field-label">Unlock code</span>
              <input type="password" inputMode="numeric" placeholder="Enter unlock code" value={unlock} onChange={event => setUnlock(event.target.value)} />
            </label>
          )}
          <button type="button" className="axon-action-button primary" onClick={make} disabled={busy || (needsUnlock && !unlock.trim())}>
            <KeyRound size={14} />{busy ? "Creating…" : linked ? "Create another link code" : "Create link code"}
          </button>
        </div>
      )}
      {error && <p className="axon-inline-error" role="alert">{error}</p>}
    </div>
  );
}

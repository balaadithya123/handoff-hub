"use client";

import { useState } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";

export default function LinkCodeButton({ linked }: { linked: boolean; needsUnlock?: boolean }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function make() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/link-code", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.error || "Could not create a link code.");
      else { setCode(data.code); setCopied(false); }
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
          <p>Use this code with <strong>link_portal_account</strong> in the AI client you are connecting. It expires in 10 minutes and works once.</p>
          <button type="button" className="axon-text-button" onClick={() => { setCode(""); setCopied(false); }}><RefreshCw size={13} />Generate another code</button>
        </div>
      ) : (
        <button type="button" className="axon-action-button primary" onClick={make} disabled={busy}>
          <KeyRound size={14} />{busy ? "Creating…" : linked ? "Create another link code" : "Create link code"}
        </button>
      )}
      {error && <p className="axon-inline-error" role="alert">{error}</p>}
    </div>
  );
}

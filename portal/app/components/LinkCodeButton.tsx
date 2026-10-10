"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Copy, Check } from "lucide-react";

export default function LinkCodeButton({
  linked,
  needsUnlock = false,
}: {
  linked: boolean;
  needsUnlock?: boolean;
}) {
  const [code, setCode] = useState("");
  const [unlock, setUnlock] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function make() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/link-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setError(d.error || "Could not create a code.");
      else setCode(d.code);
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (code) {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[#121212] border border-[#60eca8]/30 flex items-center justify-between">
          <div className="font-mono text-xl font-bold tracking-widest text-[#60eca8]">
            {code}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            icon={copied ? <Check className="w-4 h-4 text-[#60eca8]" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-[#a1a1a1]">
          In your AI assistant prompt, say: <strong className="text-[#ededed]">Call link_portal_account with code {code}</strong>.
          The code expires in 10 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {needsUnlock && (
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Unlock code"
            value={unlock}
            onChange={(e) => setUnlock(e.target.value)}
            aria-label="Unlock code"
            className="w-36"
          />
        )}
        <Button
          variant="primary"
          onClick={make}
          loading={busy}
          disabled={busy || (needsUnlock && !unlock.trim())}
        >
          {linked ? "Add another AI account" : "Create link code"}
        </Button>
      </div>
      {error && <p className="text-xs text-[#ff7b7b]">{error}</p>}
    </div>
  );
}

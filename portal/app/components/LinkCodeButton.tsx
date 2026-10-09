"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

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

  if (code) {
    return (
      <div className="space-y-2 p-3.5 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30">
        <div className="font-mono font-extrabold text-2xl text-[#3ecf8e] text-center tracking-widest py-2 bg-black/40 rounded-lg">
          {code}
        </div>
        <p className="text-xs text-[#a1a1a1]">
          In your AI assistant session, say: <strong className="text-[#ededed]">Call link_portal_account with code {code}</strong>. Code expires in 10 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {needsUnlock && (
          <div className="w-40">
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Unlock code"
              value={unlock}
              onChange={(e) => setUnlock(e.target.value)}
            />
          </div>
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

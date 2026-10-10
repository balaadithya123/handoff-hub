"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

export default function UnlinkButton({ id, name }: { id: string; name?: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/unlink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);

    if (r && r.ok) {
      window.location.reload();
      return;
    }
    const d = r ? await r.json().catch(() => ({})) : {};
    setErr(d?.error || "Could not unlink. Try again.");
    setBusy(false);
  }

  if (!asking) {
    return (
      <Button variant="ghost" size="sm" onClick={() => { setErr(""); setAsking(true); }}>
        Unlink
      </Button>
    );
  }

  const who = name ? `"${name}"` : "this AI account";

  return (
    <div className="space-y-2 min-w-[200px]">
      <p className="text-xs text-[#a1a1a1]">Unlink {who}? It will stop using your connections.</p>
      <div className="flex items-center gap-2">
        <Button variant="danger" size="sm" onClick={go} loading={busy}>
          Yes, unlink
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAsking(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
      {err && <p className="text-[11px] text-[#ff7b7b]">{err}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";

export default function UnlinkButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (!window.confirm("Unlink this AI account? It will stop using your connections.")) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/unlink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    if (r && r.ok) window.location.reload();
    else { setErr("Could not unlink."); setBusy(false); }
  }
  return <><button type="button" className="shBtn ghost" onClick={go} disabled={busy}>{busy ? "Unlinking\u2026" : "Unlink"}</button>{err && <p className="shErr">{err}</p>}</>;
}

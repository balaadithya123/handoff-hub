"use client";
import { useState } from "react";

export default function UnlinkButton({ id, name }: { id: string; name?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    const who = name ? "\"" + name + "\"" : "this AI account";
    if (!window.confirm("Unlink " + who + "? It will stop using your connections. Your other linked accounts are not affected.")) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/unlink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    if (r && r.ok) window.location.reload();
    else { setErr("Could not unlink."); setBusy(false); }
  }
  return <><button type="button" className="shBtn ghost" onClick={go} disabled={busy}>{busy ? "Unlinking…" : "Unlink"}</button>{err && <p className="shErr">{err}</p>}</>;
}

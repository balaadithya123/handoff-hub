"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Approve or deny one pending approval request from the portal. */
export default function ApprovalButtons({ hub, id }: { hub: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function decide(decision: "approve" | "deny") {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/approval", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hub, id, decision }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r && r.ok) { router.refresh(); return; }
    setErr(d?.error || "Could not save the decision.");
    setBusy(false);
  }
  return (
    <div>
      <div className="aiRow">
        <button type="button" className="shBtn" onClick={() => decide("approve")} disabled={busy}>Approve</button>
        <button type="button" className="shBtn ghost danger" onClick={() => decide("deny")} disabled={busy}>Deny</button>
      </div>
      {err && <p className="shErr" role="alert">{err}</p>}
    </div>
  );
}

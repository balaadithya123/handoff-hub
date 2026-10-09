"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

export default function ApprovalButtons({ hub, id }: { hub: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function decide(decision: "approve" | "deny") {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub, id, decision }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r && r.ok) {
      router.refresh();
      return;
    }
    setErr(d?.error || "Could not save the decision.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => decide("approve")} loading={busy}>
          Approve
        </Button>
        <Button variant="danger" size="sm" onClick={() => decide("deny")} loading={busy}>
          Deny
        </Button>
      </div>
      {err && <span className="text-[10px] text-[#ff7b7b]">{err}</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle } from "lucide-react";

/** Approve or deny one pending approval request from the portal. */
export default function ApprovalButtons({ hub, id }: { hub: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function decide(decision: "approve" | "deny") {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
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
      setErr(d?.error || "Could not save decision.");
      setBusy(false);
    } catch {
      setErr("Network error decision.");
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => decide("approve")}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/30 text-[#3ecf8e] border border-[#3ecf8e]/40 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          <span>Approve</span>
        </button>
        <button
          type="button"
          onClick={() => decide("deny")}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#ff7b7b]/10 hover:bg-[#ff7b7b]/20 text-[#ff7b7b] border border-[#ff7b7b]/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          <span>Deny</span>
        </button>
      </div>
      {err && <span className="text-[11px] text-[#ff7b7b]">{err}</span>}
    </div>
  );
}

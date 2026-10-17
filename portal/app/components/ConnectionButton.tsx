"use client";

import { useState } from "react";

export default function ConnectionButton({
  provider,
  connected,
  available = true,
}: {
  provider: string;
  connected: boolean;
  available?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!available) {
    return (
      <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium text-[#525252] border border-white/[0.06]">
        Soon
      </span>
    );
  }

  if (!connected) {
    return (
      <a
        href={`/api/connect/${provider}`}
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[#1c1c1c] border border-white/[0.1] text-[#f5f5f5] hover:bg-white hover:text-black transition-colors"
      >
        Add
      </a>
    );
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/disconnect/${provider}`, { method: "POST" });
    if (r.ok) window.location.reload();
    else {
      setError("Could not disconnect.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={disconnect}
        disabled={busy}
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[rgba(107,158,255,0.12)] border border-[rgba(107,158,255,0.28)] text-[#93b4ff] hover:bg-[rgba(107,158,255,0.2)] transition-colors disabled:opacity-50"
      >
        {busy ? "Disconnecting…" : "Connected"}
      </button>
      {error && <small className="text-[10px] text-[#e07070]">{error}</small>}
    </div>
  );
}

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
      <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium text-[#555] border border-white/5">
        Soon
      </span>
    );
  }

  if (!connected) {
    return (
      <a
        href={`/api/connect/${provider}`}
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[#1a1a1a] border border-white/10 text-[#ededed] hover:bg-white hover:text-black transition-colors"
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
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#5be3a6] hover:bg-[#3ecf8e]/20 transition-colors disabled:opacity-50"
      >
        {busy ? "Disconnecting…" : "Connected"}
      </button>
      {error && <small className="text-[10px] text-[#ff7b7b]">{error}</small>}
    </div>
  );
}

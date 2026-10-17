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
      <span className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium text-[#9a988f]">
        Soon
      </span>
    );
  }

  if (!connected) {
    return (
      <a
        href={`/api/connect/${provider}`}
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium border border-[#e7e4dc] bg-white text-[#141414] hover:bg-[#141414] hover:text-[#f6f5f2] transition-colors"
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
        className="inline-flex items-center h-8 px-3.5 rounded-full text-xs font-medium bg-[#e8f0fc] border border-[rgba(47,111,224,0.28)] text-[#2f6fe0] hover:bg-[#d6e6fb] transition-colors disabled:opacity-50"
      >
        {busy ? "Disconnecting…" : "Connected"}
      </button>
      {error && <small className="text-[10px] text-[#c44]">{error}</small>}
    </div>
  );
}

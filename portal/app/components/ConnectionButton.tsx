"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

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
      <Button variant="ghost" size="sm" disabled>
        Coming soon
      </Button>
    );
  }

  if (!connected) {
    return (
      <a href={"/api/connect/" + provider}>
        <Button variant="primary" size="sm">
          Connect
        </Button>
      </a>
    );
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/disconnect/" + provider, { method: "POST" });
      if (r.ok) {
        window.location.reload();
      } else {
        setError("Could not disconnect.");
        setBusy(false);
      }
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <Button variant="danger" size="sm" onClick={disconnect} loading={busy}>
        {busy ? "Disconnecting…" : "Disconnect"}
      </Button>
      {error && <span className="text-[10px] text-[#ff7b7b]">{error}</span>}
    </div>
  );
}

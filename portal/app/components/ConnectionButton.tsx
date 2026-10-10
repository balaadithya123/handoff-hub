"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

export default function ConnectionButton({
  provider,
  connected,
  available = true,
  expired = false,
}: {
  provider: string;
  connected: boolean;
  available?: boolean;
  expired?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!available) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Coming soon
      </Button>
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
        setError("Could not disconnect");
        setBusy(false);
      }
    } catch {
      setError("Network error");
      setBusy(false);
    }
  }

  if (connected && expired) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = "/api/connect/" + provider;
            }}
          >
            Reconnect
          </Button>
          <Button variant="ghost" size="sm" onClick={disconnect} loading={busy}>
            Disconnect
          </Button>
        </div>
        {error && <span className="text-[10px] text-[#ff7b7b]">{error}</span>}
      </div>
    );
  }

  if (!connected) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          window.location.href = "/api/connect/" + provider;
        }}
      >
        Connect
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" size="sm" onClick={disconnect} loading={busy}>
        Connected · Disconnect
      </Button>
      {error && <span className="text-[10px] text-[#ff7b7b]">{error}</span>}
    </div>
  );
}

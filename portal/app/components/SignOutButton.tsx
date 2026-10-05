"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function out() {
    setBusy(true);
    await fetch("/api/account", { method: "DELETE" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={out} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

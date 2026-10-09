"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

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
    <button
      type="button"
      onClick={out}
      disabled={busy}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#ff7b7b] hover:bg-[#ff7b7b]/10 transition-colors cursor-pointer disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

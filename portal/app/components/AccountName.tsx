"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const MAX = 40;

export default function AccountName({
  id,
  label,
  nickname,
}: {
  id: string;
  label: string;
  nickname: string | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function start() {
    setValue(saved ?? "");
    setErr("");
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setErr("");
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nickname: value.trim() === "" ? null : value }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r && r.ok) {
      setSaved(d.nickname ?? null);
      setEditing(false);
      router.refresh();
    } else {
      setErr(d?.error || "Could not save the name.");
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            autoFocus
            value={value}
            maxLength={MAX}
            aria-label={"Nickname for " + label}
            placeholder={label}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") cancel();
            }}
            className="w-48"
          />
          <Button variant="primary" size="sm" onClick={save} loading={busy}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
        <p className="text-[10px] text-[#707070]">Original name: {label} (fixed).</p>
        {err && <p className="text-[11px] text-[#ff7b7b]">{err}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-[#ededed]">{saved || label}</span>
      {saved && <span className="text-[10px] text-[#707070]">({label})</span>}
      <Button variant="ghost" size="sm" onClick={start} aria-label={"Edit nickname for " + label}>
        Edit nickname
      </Button>
    </div>
  );
}

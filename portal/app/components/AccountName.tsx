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
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-48">
            <Input
              autoFocus
              value={value}
              maxLength={MAX}
              placeholder={label}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                } else if (e.key === "Escape") cancel();
              }}
            />
          </div>
          <Button variant="primary" size="sm" onClick={save} loading={busy}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
        <p className="text-[10px] text-[#8a8a8a]">Original name: {label}</p>
        {err && <p className="text-xs text-[#ff7b7b]">{err}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-xs text-[#ededed]">{saved || label}</span>
      <Button variant="ghost" size="sm" onClick={start}>
        Edit nickname
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";

const MAX = 40;

type Props = {
  hub: string;
  clientId: string;
  name: string;
  nickname: string | null;
  active: boolean;
  lastText: string;
  connectedText: string;
};

type Out = { ok: boolean; d: { error?: string; nickname?: string | null } };

export default function AiClientCard({
  hub,
  clientId,
  name,
  nickname,
  active,
  lastText,
  connectedText,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function call(body: Record<string, unknown>): Promise<Out> {
    const r = await fetch("/api/ai-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub, client: clientId, ...body }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    return { ok: Boolean(r && r.ok), d };
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const o = await call({ action: "rename", nickname: value.trim() === "" ? null : value });
    setBusy(false);
    if (o.ok) {
      setSaved(o.d.nickname ?? null);
      setEditing(false);
      router.refresh();
    } else {
      setErr(o.d.error || "Could not save the name.");
    }
  }

  async function unlink() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const o = await call({ action: "unlink" });
    if (o.ok) {
      router.refresh();
      return;
    }
    setErr(o.d.error || "Could not unlink. Try again.");
    setBusy(false);
  }

  const shown = saved || name;

  return (
    <div className="p-3.5 rounded-xl bg-[#111] border border-white/10 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-[#ededed] shrink-0">
            {shown.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            {editing ? (
              <Input
                autoFocus
                value={value}
                maxLength={MAX}
                placeholder={name}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    save();
                  } else if (e.key === "Escape") {
                    setEditing(false);
                    setErr("");
                  }
                }}
              />
            ) : (
              <span className="font-semibold text-xs text-[#ededed] truncate block">{shown}</span>
            )}
            <span className="text-[10px] font-mono text-[#8a8a8a] block truncate">
              {saved ? name + " • " : ""}ID …{clientId.slice(-4)}
            </span>
          </div>
        </div>
        <Badge variant={active ? "green" : "grey"}>{active ? "Active" : "Idle"}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded bg-black/40 border border-white/5">
        <div>
          <span className="text-[#8a8a8a] block">Last Active</span>
          <span className="text-[#ededed]">{lastText}</span>
        </div>
        <div>
          <span className="text-[#8a8a8a] block">Connected</span>
          <span className="text-[#ededed]">{connectedText}</span>
        </div>
      </div>

      {asking ? (
        <div className="p-2.5 rounded-lg bg-[#ff7b7b]/10 border border-[#ff7b7b]/30 space-y-2">
          <p className="text-xs text-[#ff7b7b]">
            Unlink <strong>{shown}</strong>? Only this AI client will be signed out.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={unlink} loading={busy}>
              Yes, unlink
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAsking(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={save} loading={busy}>
            Save name
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setErr("");
            }}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setValue(saved ?? "");
              setErr("");
              setEditing(true);
            }}
          >
            Rename
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#ff7b7b] hover:bg-[#ff7b7b]/10"
            onClick={() => {
              setErr("");
              setAsking(true);
            }}
          >
            Unlink
          </Button>
        </div>
      )}

      {err && <p className="text-xs text-[#ff7b7b]">{err}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Bot, Edit2, Trash2 } from "lucide-react";

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
    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/8 space-y-3 transition-colors hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#121212] border border-white/8 flex items-center justify-center text-[#60eca8] font-bold text-xs shrink-0">
            {shown.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <Input
                autoFocus
                value={value}
                maxLength={MAX}
                aria-label={"Nickname for " + name}
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
              <span className="block text-xs font-semibold text-[#ededed] truncate">{shown}</span>
            )}
            <span className="block text-[10px] font-mono text-[#707070] truncate">
              {saved ? `${name} • ` : ""}ID ...{clientId.slice(-4)}
            </span>
          </div>
        </div>
        <Badge variant={active ? "green" : "grey"} dot>
          {active ? "Active" : "Idle"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#a1a1a1] pt-1 border-t border-white/5">
        <div>
          <span className="text-[#707070] block text-[10px]">Last active</span>
          <span>{lastText}</span>
        </div>
        <div>
          <span className="text-[#707070] block text-[10px]">Connected</span>
          <span>{connectedText}</span>
        </div>
      </div>

      {asking ? (
        <div className="p-3 rounded-lg bg-[#121212] border border-[#ff7b7b]/30 space-y-2">
          <p className="text-xs text-[#a1a1a1]">
            Unlink <strong className="text-[#ededed]">{shown}</strong>? Only this AI app will be signed out.
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
        <div className="flex items-center gap-2 pt-1">
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
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 className="w-3 h-3" />}
            onClick={() => {
              setValue(saved ?? "");
              setErr("");
              setEditing(true);
            }}
          >
            Rename
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3 h-3" />}
            onClick={() => {
              setErr("");
              setAsking(true);
            }}
          >
            Unlink
          </Button>
        </div>
      )}

      {err && <p className="text-[11px] text-[#ff7b7b]">{err}</p>}
    </div>
  );
}

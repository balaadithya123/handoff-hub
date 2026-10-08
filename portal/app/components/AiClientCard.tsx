"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MAX = 40;

type Props = { hub: string; clientId: string; name: string; nickname: string | null; active: boolean; lastText: string; connectedText: string };
type Out = { ok: boolean; d: { error?: string; nickname?: string | null } };

function kindOf(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("claude")) return "claude";
  if (n.includes("gpt") || n.includes("openai")) return "chatgpt";
  return "other";
}

/** One connected AI app (Claude, ChatGPT, ...) with its own nickname and its own Unlink. */
export default function AiClientCard({ hub, clientId, name, nickname, active, lastText, connectedText }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(nickname);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function call(body: Record<string, unknown>): Promise<Out> {
    const r = await fetch("/api/ai-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hub, client: clientId, ...body }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    return { ok: Boolean(r && r.ok), d };
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const o = await call({ action: "rename", nickname: value.trim() === "" ? null : value });
    setBusy(false);
    if (o.ok) { setSaved(o.d.nickname ?? null); setEditing(false); router.refresh(); }
    else setErr(o.d.error || "Could not save the name.");
  }

  async function unlink() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const o = await call({ action: "unlink" });
    if (o.ok) { router.refresh(); return; }
    setErr(o.d.error || "Could not unlink. Try again.");
    setBusy(false);
  }

  const shown = saved || name;
  return (
    <article className="aiCard" data-kind={kindOf(name)}>
      <div className="aiTop">
        <div className="aiAvatar" aria-hidden="true">{shown.charAt(0).toUpperCase()}</div>
        <div className="aiId">
          {editing ? (
            <input
              autoFocus
              className="shInput"
              value={value}
              maxLength={MAX}
              aria-label={"Nickname for " + name}
              placeholder={name}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } else if (e.key === "Escape") { setEditing(false); setErr(""); } }}
            />
          ) : (
            <b className="aiName">{shown}</b>
          )}
          <span className="aiMeta">{saved ? name + " \u00b7 " : ""}ID \u2026{clientId.slice(-4)}</span>
        </div>
        <span className={"aiState " + (active ? "on" : "idle")}><i />{active ? "Active" : "Idle"}</span>
      </div>

      <dl className="aiFacts">
        <div><dt>Last active</dt><dd>{lastText}</dd></div>
        <div><dt>Connected</dt><dd>{connectedText}</dd></div>
      </dl>

      {asking ? (
        <div className="aiConfirm">
          <p>Unlink <b>{shown}</b>? Only this AI app is signed out. Your other AI apps stay connected.</p>
          <div className="aiRow">
            <button type="button" className="shBtn danger" onClick={unlink} disabled={busy}>{busy ? "Unlinking\u2026" : "Yes, unlink"}</button>
            <button type="button" className="shBtn ghost" onClick={() => setAsking(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : editing ? (
        <div className="aiRow">
          <button type="button" className="shBtn" onClick={save} disabled={busy}>{busy ? "Saving\u2026" : "Save name"}</button>
          <button type="button" className="shBtn ghost" onClick={() => { setEditing(false); setErr(""); }} disabled={busy}>Cancel</button>
        </div>
      ) : (
        <div className="aiRow">
          <button type="button" className="shBtn ghost" onClick={() => { setValue(saved ?? ""); setErr(""); setEditing(true); }}>Rename</button>
          <button type="button" className="shBtn ghost danger" onClick={() => { setErr(""); setAsking(true); }}>Unlink</button>
        </div>
      )}
      {err && <p className="shErr" role="alert">{err}</p>}
    </article>
  );
}

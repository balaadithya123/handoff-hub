"use client";
import { useState } from "react";

type Kind = "github" | "vercel";

/** Add / remove Vercel project ids and GitHub repos the Hub is allowed to act on. */
export default function AllowlistEditor({ hubId, kind, initial }: { hubId: string; kind: Kind; initial: string[] }) {
  const [list, setList] = useState<string[]>(initial);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const hint = kind === "github" ? "owner/name" : "prj_…";

  async function run(action: "add" | "remove", v: string) {
    if (busy || !v.trim()) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/allowlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: hubId, kind, action, value: v.trim() }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r && r.ok) { setList(d.list ?? []); if (action === "add") setValue(""); }
    else setErr(d?.error || "Could not update.");
  }

  return (
    <div className="shPad">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>{kind === "github" ? "GitHub repositories" : "Vercel projects"}</h3>
      {list.length === 0 ? <p className="shMuted">None allowed yet.</p> : (
        <div style={{ marginBottom: 8 }}>
          {list.map(v => (
            <span className="shTag" key={v}>{v}<button type="button" aria-label={"Remove " + v} onClick={() => run("remove", v)} disabled={busy} style={{ marginLeft: 6, border: 0, background: "none", color: "inherit", cursor: "pointer" }}>×</button></span>
          ))}
        </div>
      )}
      <div className="shField">
        <input value={value} placeholder={hint} aria-label={"Add " + kind} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); run("add", value); } }} />
        <button type="button" className="shBtn" onClick={() => run("add", value)} disabled={busy || !value.trim()}>{busy ? "Saving…" : "Add"}</button>
      </div>
      {err && <p className="shErr" role="alert">{err}</p>}
    </div>
  );
}

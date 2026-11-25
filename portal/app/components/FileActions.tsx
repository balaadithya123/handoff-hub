"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

export function FileExport({ hubUser, fileId }: { hubUser: string; fileId: string }) {
  return (
    <a className="axon-action-button" title="Download this file"
      href={`/api/files/download?hub_user=${encodeURIComponent(hubUser)}&file=${encodeURIComponent(fileId)}`}>
      <Download size={13} />Export
    </a>
  );
}

export function FileDelete({ hubUser, fileId, name }: { hubUser: string; fileId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (busy) return;
    if (!window.confirm(`Delete "${name}" permanently? This frees its storage and cannot be undone.`)) return;
    setBusy(true); setError("");
    const response = await fetch("/api/files", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hub_user: hubUser, file_id: fileId }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    setBusy(false);
    if (response?.ok) router.refresh();
    else setError(typeof data?.error === "string" ? data.error : "Could not delete the file.");
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={remove} disabled={busy} className="axon-archive-button" title="Delete this file">
        <Trash2 size={13} />{busy ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-[11px] text-red-300">{error}</span>}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, FileDown, Save } from "lucide-react";
import { estimateTokens, pagesToMarkdown, type PdfItem } from "../../lib/pdfToMarkdown";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
const WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
const MAX_PDF = 30 * 1024 * 1024;

type Account = { id: string; label: string };

export default function PdfConverter({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [md, setMd] = useState("");
  const [name, setName] = useState("");
  const [stats, setStats] = useState<{ pages: number; chars: number; tokens: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [account, setAccount] = useState(accounts[0]?.id ?? "");
  const [separators, setSeparators] = useState(false);
  const pagesRef = useRef<PdfItem[][]>([]);

  const render = (pages: PdfItem[][], seps: boolean) => {
    const out = pagesToMarkdown(pages, { detectHeadings: true, pageSeparators: seps, dropRepeated: true });
    setMd(out);
    setStats({ pages: pages.length, chars: out.length, tokens: estimateTokens(out) });
  };

  async function convert(file: File) {
    setMsg(""); setMd(""); setStats(null);
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return setMsg("Choose a PDF file.");
    if (file.size > MAX_PDF) return setMsg("That PDF is over 30 MB.");
    setBusy(true);
    try {
      const pdfjs: any = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ PDFJS);
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const pages: PdfItem[][] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const content = await (await doc.getPage(i)).getTextContent();
        pages.push((content.items as any[]).filter(it => typeof it.str === "string") as PdfItem[]);
      }
      pagesRef.current = pages;
      setName(file.name.replace(/\.pdf$/i, "") + ".md");
      render(pages, separators);
      if (!pages.some(p => p.length)) setMsg("No text found. This looks like a scanned PDF, which needs OCR.");
    } catch (e) {
      setMsg(e instanceof Error ? `Could not read the PDF: ${e.message}` : "Could not read the PDF.");
    } finally { setBusy(false); }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = name || "converted.md"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(md); setMsg("Copied."); } catch { setMsg("Copy blocked by the browser."); }
  }

  async function save() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/files/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hub_user: account, name, text: md }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not save.");
      setMsg(`Saved ${d.name} to the library.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  return (
    <section className="axon-converter">
      <div className="axon-converter-head">
        <FileDown size={16} />
        <div>
          <h2>PDF to Markdown</h2>
          <p>Converts in your browser, nothing is uploaded until you save. Markdown uses far fewer tokens than raw PDF text.</p>
        </div>
      </div>
      <div className="axon-converter-controls">
        <input ref={input} type="file" accept="application/pdf,.pdf" onChange={e => e.target.files?.[0] && convert(e.target.files[0])} />
        <label className="axon-converter-check">
          <input type="checkbox" checked={separators} onChange={e => { setSeparators(e.target.checked); if (pagesRef.current.length) render(pagesRef.current, e.target.checked); }} />
          Page separators
        </label>
      </div>
      {busy && !md && <p className="axon-converter-note">Reading PDF…</p>}
      {msg && <p className="axon-converter-note" role="status">{msg}</p>}
      {stats && md && (
        <>
          <p className="axon-converter-note">{stats.pages} pages · {stats.chars.toLocaleString()} characters · about {stats.tokens.toLocaleString()} tokens</p>
          <textarea readOnly value={md} rows={12} className="axon-converter-output" aria-label="Converted Markdown" />
          <div className="axon-converter-actions">
            <button type="button" className="axon-action-button" onClick={download}><Download size={13} />Download .md</button>
            <button type="button" className="axon-action-button" onClick={copy}><Copy size={13} />Copy</button>
            {accounts.length > 1 && (
              <select value={account} onChange={e => setAccount(e.target.value)} aria-label="Account">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            )}
            <button type="button" className="axon-action-button" disabled={busy || !account} onClick={save}><Save size={13} />Save to library</button>
          </div>
        </>
      )}
    </section>
  );
}

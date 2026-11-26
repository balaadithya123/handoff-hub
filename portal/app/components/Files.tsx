import Link from "next/link";
import { ArrowUpRight, Bot, FileText, FolderOpen, HardDrive, Files as FilesIcon } from "lucide-react";
import { getProjects } from "../../lib/data";
import { filesList, type FileLibrary } from "../../lib/connections";
import { FileExport, FileDelete } from "./FileActions";
import PdfConverter from "./PdfConverter";
import "./files.css";

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(bytes < 10485760 ? 2 : 1)} MB`;
}

function when(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export default async function Files({ token }: { token: string }) {
  const data = await getProjects(token).catch(() => null);
  if (!data?.ok) {
    return (
      <section className="axon-empty-state">
        <FolderOpen size={28} />
        <h2>Files couldn’t be loaded</h2>
        <p>Axon couldn’t retrieve your linked AI accounts. Refresh the page and try again.</p>
      </section>
    );
  }

  const accounts = data.accounts ?? [];
  const libraries = await Promise.all(
    accounts.map(async account => ({
      account,
      library: (await filesList(token, account.id).catch(() => null)) as FileLibrary | null,
    }))
  );

  if (accounts.length === 0) {
    return (
      <section className="axon-empty-state">
        <Bot size={28} />
        <h2>Connect an AI account first</h2>
        <p>Shared files belong to a linked AI account. Connect one, then ask your AI to share a file through Axon.</p>
        <Link href="/ai" className="axon-primary-link">Open AI Accounts <ArrowUpRight size={15} /></Link>
      </section>
    );
  }

  return (
    <div className="axon-page axon-projects">
      <section className="axon-page-heading">
        <div>
          <p className="axon-eyebrow">WORKSPACE / FILES</p>
          <h1>Files</h1>
          <p>Files your AI apps shared through Axon. Each account can store 100 MB, up to 30 MB per file. Delete files to free space.</p>
        </div>
        <div className="axon-heading-mark"><FolderOpen size={21} /></div>
      </section>

      <PdfConverter accounts={accounts.map(a => ({ id: a.id, label: a.nickname || a.label }))} />

      <div className="space-y-7">
        {libraries.map(({ account, library }) => {
          const used = library?.used_bytes ?? 0;
          const limit = library?.limit_bytes ?? 104857600;
          const pct = Math.min(100, Math.round((used / limit) * 100));
          const tone = pct >= 100 ? "is-full" : pct >= 80 ? "is-warning" : "";
          const files = library?.files ?? [];
          return (
            <section className="axon-account-section" key={account.id}>
              <header className="axon-section-header">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="axon-account-avatar"><Bot size={18} /></span>
                  <div className="min-w-0">
                    <h2>{account.nickname || account.label}</h2>
                    <p>{account.nickname ? account.label + " · " : ""}{files.length} {files.length === 1 ? "file" : "files"}</p>
                  </div>
                </div>
              </header>

              {!library ? (
                <div className="axon-inline-empty">
                  <HardDrive size={18} />
                  <span><strong>Files couldn’t be loaded for this account</strong><small>Refresh the page to try again.</small></span>
                </div>
              ) : (
                <>
                  <div className={`axon-storage-meter ${tone}`}>
                    <div className="axon-storage-meter-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="axon-storage-meter-text">
                      <span>{size(used)} of {size(limit)} used</span>
                      <span>{size(Math.max(0, limit - used))} free</span>
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <div className="axon-inline-empty">
                      <FilesIcon size={18} />
                      <span><strong>No files yet</strong><small>Ask an AI connected to Axon to share a file and it will show up here.</small></span>
                    </div>
                  ) : (
                    <div className="axon-file-scroll mt-4">
                      <table className="axon-file-list">
                        <thead>
                          <tr><th>File</th><th>Size</th><th>Sent by</th><th>Added</th><th aria-label="Actions" /></tr>
                        </thead>
                        <tbody>
                          {files.map(file => (
                            <tr key={file.id}>
                              <td>
                                <div className="axon-file-name">
                                  <strong><FileText size={13} className="inline mr-1.5 opacity-60" />{file.name}</strong>
                                  {file.note && <small>{file.note}</small>}
                                </div>
                              </td>
                              <td>{size(file.size_bytes)}</td>
                              <td>{file.uploaded_by || "—"}</td>
                              <td>{when(file.created_at)}</td>
                              <td>
                                <div className="axon-file-actions">
                                  <FileExport hubUser={account.id} fileId={file.id} />
                                  <FileDelete hubUser={account.id} fileId={file.id} name={file.name} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

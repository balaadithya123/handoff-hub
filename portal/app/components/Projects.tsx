import Link from "next/link";
import {
  Activity, ArrowUpRight, Bot, CheckCircle2, Clock3, Database,
  FolderKanban, Plus, ShieldAlert, Sparkles, Waypoints,
} from "lucide-react";
import { getProjects } from "../../lib/data";
import { PortalSwitch, ProjectCreate, ProjectArchiveButton, ProjectRestoreButton } from "./ProjectActions";

function dateLabel(value?: string | null) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return new Intl.DateTimeFormat("en", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}

function Metric({ label, value, icon: Icon, tone = "neutral" }: {
  label: string; value: number | string; icon: typeof Database; tone?: "neutral" | "warning";
}) {
  return (
    <div className="project-metric">
      <span className={`project-metric-icon ${tone === "warning" ? "warning" : ""}`}><Icon size={15} /></span>
      <span className="min-w-0">
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

export default async function Projects({ token }: { token: string }) {
  const data = await getProjects(token).catch(() => null);
  if (!data?.ok) {
    return (
      <section className="axon-empty-state">
        <FolderKanban size={28} />
        <h2>Projects couldn’t be loaded</h2>
        <p>Axon couldn’t retrieve your project pools. Refresh the page and try again.</p>
      </section>
    );
  }

  const accounts = data.accounts ?? [];
  const archivedAccounts = data.archived_accounts ?? [];
  const projects = accounts.flatMap(account => account.projects ?? []);
  const totalMemories = projects.reduce((sum, project) => sum + (project.counts?.memories ?? 0), 0);
  const totalTasks = projects.reduce((sum, project) => sum + (project.counts?.tasks ?? 0), 0);
  const totalBlockers = projects.reduce((sum, project) => sum + (project.counts?.blockers ?? 0), 0);
  const portalFeeds = projects.filter(project => project.is_portal).length;

  return (
    <div className="axon-page axon-projects">
      <section className="axon-page-heading">
        <div>
          <p className="axon-eyebrow">WORKSPACE / PROJECTS</p>
          <h1>Projects &amp; Pools</h1>
          <p>Keep work, memory and AI activity organised in separate project spaces.</p>
        </div>
        <div className="axon-heading-mark"><FolderKanban size={21} /></div>
      </section>

      <section className="axon-stat-grid" aria-label="Project summary">
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><FolderKanban size={17} /></span>
          <span className="axon-stat-copy"><strong>{projects.length}</strong><small>Project pools</small></span>
        </div>
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><Database size={17} /></span>
          <span className="axon-stat-copy"><strong>{totalMemories}</strong><small>Saved memories</small></span>
        </div>
        <div className="axon-stat-card">
          <span className="axon-stat-icon"><Waypoints size={17} /></span>
          <span className="axon-stat-copy"><strong>{totalTasks}</strong><small>Recorded tasks</small></span>
        </div>
        <div className="axon-stat-card">
          <span className={`axon-stat-icon ${totalBlockers ? "is-warning" : ""}`}><ShieldAlert size={17} /></span>
          <span className="axon-stat-copy"><strong>{totalBlockers}</strong><small>Open blockers</small></span>
        </div>
      </section>

      {accounts.length === 0 ? (
        <section className="axon-empty-state">
          <Bot size={28} />
          <h2>Connect an AI account first</h2>
          <p>Your project pools are attached to linked AI accounts. Connect one to start creating isolated workspaces.</p>
          <Link href="/ai" className="axon-primary-link">Open AI Accounts <ArrowUpRight size={15} /></Link>
        </section>
      ) : (
        <div className="space-y-7">
          {accounts.map(account => {
            const rows = [...(account.projects ?? [])].sort(
              (a, b) => Number(b.is_portal) - Number(a.is_portal)
                || String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""))
            );
            return (
              <section className="axon-account-section" key={account.id}>
                <header className="axon-section-header">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="axon-account-avatar"><Bot size={18} /></span>
                    <div className="min-w-0">
                      <h2>{account.nickname || account.label}</h2>
                      <p>{account.nickname ? account.label + " · " : ""}{rows.length} {rows.length === 1 ? "pool" : "pools"}</p>
                    </div>
                  </div>
                  {account.ops_project !== "default" && (
                    <PortalSwitch hubUser={account.id} project="default" label="Use default pool" ghost />
                  )}
                </header>

                {rows.length === 0 ? (
                  <div className="axon-inline-empty">
                    <Database size={18} />
                    <span><strong>No project pools yet</strong><small>Create a pool below to keep this AI account’s work separate.</small></span>
                  </div>
                ) : (
                  <div className="axon-project-grid">
                    {rows.map(project => (
                      <article className="axon-project-card" key={project.id}>
                        <div className="axon-project-card-top">
                          <div className="axon-project-symbol"><FolderKanban size={18} /></div>
                          {project.is_portal ? (
                            <span className="axon-status-chip success"><span />Portal feed</span>
                          ) : (
                            <span className="axon-status-chip neutral">Private pool</span>
                          )}
                        </div>
                        <div className="axon-project-title">
                          <h3>{project.name}</h3>
                          <p>{project.description || "A separate memory pool for this project."}</p>
                        </div>
                        <div className="axon-project-metrics">
                          <Metric label="Memories" value={project.counts?.memories ?? 0} icon={Database} />
                          <Metric label="Tasks" value={`${project.counts?.pending_tasks ?? 0} / ${project.counts?.tasks ?? 0}`} icon={Waypoints} />
                          <Metric label="Claims" value={project.counts?.claims ?? 0} icon={Activity} />
                          <Metric label="Blockers" value={project.counts?.blockers ?? 0} icon={ShieldAlert} tone={(project.counts?.blockers ?? 0) > 0 ? "warning" : "neutral"} />
                        </div>
                        <div className="axon-project-card-footer">
                          <span><Clock3 size={13} />{dateLabel(project.updated_at)}</span>
                          {project.is_portal ? (
                            <span className="axon-feed-active"><CheckCircle2 size={14} />Active feed</span>
                          ) : (
                            <PortalSwitch hubUser={account.id} project={project.id} label="Set as feed" ghost />
                          )}
                          <ProjectArchiveButton hubUser={account.id} project={project.id} isPortal={project.is_portal} />
                        </div>
                        <details className="axon-project-activity">
                          <summary><Activity size={14} />Recent activity <span>{project.recent?.length ?? 0}</span></summary>
                          {project.summary && <p className="axon-project-summary">{project.summary}</p>}
                          {!project.recent?.length ? (
                            <p className="axon-muted-note">No recent activity recorded for this pool.</p>
                          ) : (
                            <ol>
                              {project.recent.map((event, index) => (
                                <li key={index}>
                                  <span className="axon-event-time">{dateLabel(event.at)}</span>
                                  <span className="axon-event-agent">{event.agent || "AI"}</span>
                                  <span className="axon-event-action">{(event.action || "event").replace(/_/g, " ")}</span>
                                  {event.text && <span className="axon-event-text">{event.text}</span>}
                                </li>
                              ))}
                            </ol>
                          )}
                        </details>
                      </article>
                    ))}
                  </div>
                )}

                <div className="axon-create-pool">
                  <div className="axon-create-copy">
                    <span className="axon-create-icon"><Plus size={17} /></span>
                    <span><strong>Create a project pool</strong><small>Start a clean, isolated memory space under this AI account.</small></span>
                  </div>
                  <ProjectCreate hubUser={account.id} />
                </div>
              </section>
            );
          })}
        </div>
      )}
      {archivedAccounts.some(account => account.projects?.length) && (
        <section className="axon-archived-section">
          <header>
            <div>
              <p className="axon-eyebrow">RECOVERABLE STORAGE</p>
              <h2>Archived pools</h2>
              <p>Archived pools keep their memories and activity. Restore one whenever you need it again.</p>
            </div>
            <span className="axon-archived-count">{archivedAccounts.reduce((sum, account) => sum + account.projects.length, 0)} archived</span>
          </header>
          <div className="axon-archived-list">
            {archivedAccounts.map(account => account.projects.map(project => (
              <article className="axon-archived-item" key={account.id + ":" + project.id}>
                <span className="axon-archived-icon"><FolderKanban size={17} /></span>
                <span className="axon-archived-copy">
                  <strong>{project.name}</strong>
                  <small>{account.nickname || account.label}{project.description ? " · " + project.description : ""}</small>
                </span>
                <ProjectRestoreButton hubUser={account.id} project={project.id} />
              </article>
            )))}
          </div>
        </section>
      )}
      <p className="axon-page-footnote"><Sparkles size={13} />Pools stay isolated. The portal feed controls which pool appears in Overview and Activity.</p>
    </div>
  );
}

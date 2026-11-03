"use client";

import { useMemo, useState } from "react";
import { Activity, Copy, Search, X } from "lucide-react";
import { ago, human } from "../../lib/format";

type Ev = {
  at: string;
  agent?: string;
  action?: string;
  text?: string;
  project?: string;
  project_name?: string;
};

export default function ActivityExplorer({ rows }: { rows: Ev[] }) {
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState("all");
  const [selected, setSelected] = useState<Ev | null>(null);
  const [copied, setCopied] = useState(false);

  const agents = useMemo(
    () => [...new Set(rows.map(row => row.agent || "unknown"))].sort(),
    [rows]
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(row => {
      if (agent !== "all" && (row.agent || "unknown") !== agent) return false;
      if (!term) return true;
      return [
        row.agent, row.action, row.text, row.project_name, row.project,
      ].some(value => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, query, agent]);

  async function copyEvent() {
    if (!selected || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="activity-explorer space-y-4">
      <div className="activity-toolbar">
        <label className="activity-search">
          <Search size={16} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search activities, agents or projects"
            aria-label="Search activity"
          />
        </label>
        <select
          value={agent}
          onChange={event => setAgent(event.target.value)}
          aria-label="Filter by AI client"
        >
          <option value="all">All AI clients</option>
          {agents.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="activity-results-label">
        <span>{filtered.length} {filtered.length === 1 ? "event" : "events"}</span>
        <span>Newest first</span>
      </div>

      {filtered.length === 0 ? (
        <div className="axon-empty-state compact">
          <Activity size={26} />
          <h3>No matching activity</h3>
          <p>Try a different search or clear the AI client filter.</p>
          {(query || agent !== "all") && (
            <button type="button" className="axon-action-button" onClick={() => { setQuery(""); setAgent("all"); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ol className="activity-event-list">
          {filtered.map((row, index) => (
            <li key={`${row.at}-${row.agent}-${index}`}>
              <button type="button" className="activity-event" onClick={() => { setSelected(row); setCopied(false); }}>
                <span className="activity-event-marker"><Activity size={14} /></span>
                <span className="activity-event-content">
                  <span className="activity-event-heading">
                    <strong>{human(row.action || "event")}</strong>
                    <span className="activity-agent-tag">{row.agent || "Unknown client"}</span>
                  </span>
                  <span className="activity-event-description">{row.text || "No additional details were recorded."}</span>
                  <span className="activity-event-project">{row.project_name || row.project || "Default pool"}</span>
                </span>
                <time>{ago(row.at)}</time>
              </button>
            </li>
          ))}
        </ol>
      )}

      {selected && (
        <div className="activity-detail" role="presentation" onClick={() => setSelected(null)}>
          <aside role="dialog" aria-modal="true" aria-label="Activity details" onClick={event => event.stopPropagation()}>
            <header>
              <div><span className="axon-eyebrow">ACTIVITY DETAILS</span><h2>{human(selected.action || "event")}</h2></div>
              <div className="activity-detail-actions">
                <button type="button" className="axon-action-button" onClick={copyEvent}><Copy size={13} />{copied ? "Copied" : "Copy data"}</button>
                <button type="button" className="activity-close" aria-label="Close details" onClick={() => setSelected(null)}><X size={17} /></button>
              </div>
            </header>
            <div className="activity-detail-body">
              <div className="activity-detail-grid">
                <div><small>AI client</small><strong>{selected.agent || "Unknown"}</strong></div>
                <div><small>Project pool</small><strong>{selected.project_name || selected.project || "Default pool"}</strong></div>
              </div>
              <section><small>Recorded</small><strong>{new Date(selected.at).toLocaleString()}</strong></section>
              <section><small>Details</small><p>{selected.text || "No additional details were recorded."}</p></section>
              <section><small>Event data</small><pre>{JSON.stringify(selected, null, 2)}</pre></section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

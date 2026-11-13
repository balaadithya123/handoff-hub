// Full project export as one Markdown document: overview, decisions, blockers, tasks, every saved
// memory, the recent activity, and the archived digests of older activity, oldest first.
const iso = v => (v ? String(v).slice(0, 10) : '');
const clean = v => String(v ?? '').replace(/\r/g, '').trim();
const one = v => clean(v).replace(/\s+/g, ' ');
const asText = v => (typeof v === 'string' ? v : v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
const byAtAsc = (a, b) => String(a.at || a.created_at || '').localeCompare(String(b.at || b.created_at || ''));

function list(title, rows) {
  return rows.length ? `## ${title}\n\n${rows.join('\n')}\n\n` : '';
}

function decisionLine(d) {
  if (typeof d === 'string') return `- ${d}`;
  const text = one(d.decision || d.text || d.summary || asText(d));
  const why = d.reason || d.why ? ` (why: ${one(d.reason || d.why)})` : '';
  const when = d.at || d.created_at ? `${iso(d.at || d.created_at)}: ` : '';
  return `- ${when}${text}${why}`;
}

function taskLine(t) {
  const route = `${t.from_agent || t.from || '?'} to ${t.to_agent || t.to || '?'}`;
  const done = t.completed_at ? `, completed ${iso(t.completed_at)}` : '';
  const result = t.result ? `\n  - Result: ${one(t.result)}` : '';
  return `- [${t.status || 'pending'}] ${iso(t.created_at || t.at)} ${route}: ${one(t.task)}${done}${result}`;
}

export function projectMarkdown(state, projectId, now = new Date()) {
  const p = (state.projects || {})[projectId];
  if (!p) return null;
  const name = p.name || projectId;
  const memories = [...(p.memories || [])].sort(byAtAsc);
  const events = [...(p.events || [])].sort(byAtAsc);
  const tasks = [...(p.tasks || [])].sort(byAtAsc);
  const archive = [...(p.archive || [])].sort((a, b) => a.month.localeCompare(b.month));
  const dates = [...memories, ...events, ...tasks].map(x => x.at || x.created_at).filter(Boolean).sort();

  let md = `# ${name}\n\n`;
  md += `- Project id: ${projectId}\n`;
  if (p.description) md += `- Description: ${one(p.description)}\n`;
  md += `- First recorded activity: ${iso(dates[0]) || (archive[0] ? archive[0].month : 'none')}\n`;
  md += `- Last updated: ${iso(p.updated_at) || iso(dates[dates.length - 1]) || 'unknown'}\n`;
  if (p.last_agent) md += `- Last agent: ${p.last_agent}\n`;
  md += `- Exported: ${now.toISOString().slice(0, 10)} from Axon\n`;
  md += `- Contents: ${memories.length} memories, ${events.length} recent events, ${tasks.length} tasks, ${archive.length} archived month(s)\n\n`;

  if (p.summary) md += `## Current summary\n\n${clean(typeof p.summary === 'string' ? p.summary : asText(p.summary))}\n\n`;
  md += list('Decisions', (p.decisions || []).map(decisionLine));
  md += list('Blockers', (p.blockers || []).map(b => `- ${one(asText(b))}`));
  md += list('Handoff tasks', tasks.map(taskLine));
  const claims = Object.entries(p.claims || {});
  md += list('Active claims', claims.map(([k, v]) => `- ${k}: ${one(asText(v))}`));

  md += list('Memory log (oldest first)', memories.map(m => {
    const tags = (m.tags || []).filter(t => t !== 'ckpt').slice(0, 6).join(', ');
    const meta = [iso(m.at), m.source, tags && `tags: ${tags}`].filter(Boolean).join(' | ');
    return `### ${meta || 'Memory'}\n\n${clean(m.memory)}\n`;
  }));

  md += list('Recent activity (oldest first)', events.map(e => {
    const kind = e.type || e.what || 'event';
    const text = one(e.summary || e.task || e.blocker || e.details || e.note || '');
    return `- ${iso(e.at)} [${kind}]${e.agent ? ` ${e.agent}:` : ''} ${text}`;
  }));

  if (archive.length) {
    md += '## Older history (condensed)\n\nEvents older than 30 days are condensed to the key details below.\n\n';
    md += archive.map(d => d.markdown.replace(/^# /, '### ')).join('\n') + '\n';
  }
  return md.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export function exportFilename(projectId) {
  return `${String(projectId).replace(/[^a-z0-9._-]/gi, '-')}-project-history.md`;
}

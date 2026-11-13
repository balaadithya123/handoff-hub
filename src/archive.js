// Activity archive: events older than ARCHIVE_DAYS are condensed into a short markdown digest
// per project and month, then the raw events are removed. Digest write and delete happen in the
// same state mutation, so nothing is deleted unless its digest is saved with it.
export const ARCHIVE_DAYS = 30;
const MAX_DIGESTS = 24;
const MAX_LINES_PER_DIGEST = 200;

const GROUPS = [
  ['Decisions and state updates', ['state_update']],
  ['Blockers', ['blocker_added', 'blocker_resolved']],
  ['Handoffs', ['handoff_created', 'handoff_completed']],
  ['Issues and conflicts', ['memory_conflict', 'health_check']]
];

const kindOf = e => String(e.type || e.what || 'event');
const textOf = e => String(e.summary || e.task || e.blocker || e.details || e.note || '').replace(/\s+/g, ' ').trim().slice(0, 220);

// Routine noise is dropped from the digest; anything that records a decision, blocker, handoff or a problem is kept.
function isImportant(e) {
  const kind = kindOf(e);
  const text = textOf(e);
  if (kind === 'health_check') return /found issues|FAILED/i.test(text);
  if (kind === 'verify_url') return /FAILED/i.test(text);
  if (/^(claim|release|heartbeat)/.test(kind)) return false;
  return Boolean(text);
}

function groupName(kind) {
  const hit = GROUPS.find(([, kinds]) => kinds.includes(kind));
  return hit ? hit[0] : 'Other notable events';
}

function lineFor(e) {
  const day = String(e.at || '').slice(0, 10);
  const who = e.agent ? ` ${e.agent}:` : '';
  return `${groupName(kindOf(e))}|- ${day} [${kindOf(e)}]${who} ${textOf(e)}`;
}

export function renderDigest(month, eventCount, lines) {
  const byGroup = new Map();
  for (const l of lines) {
    const i = l.indexOf('|');
    const g = l.slice(0, i);
    byGroup.set(g, [...(byGroup.get(g) || []), l.slice(i + 1)]);
  }
  const names = [...GROUPS.map(([n]) => n), 'Other notable events'];
  const body = names.filter(n => byGroup.has(n)).map(n => `## ${n}\n${byGroup.get(n).join('\n')}`).join('\n\n');
  return `# Archive ${month}\n\n${eventCount} events condensed, ${lines.length} kept as key details.\n\n${body || '_No notable events._'}\n`;
}

// Mutates `state` in place. Returns counts for the heartbeat report.
export function archiveOldEvents(state, { now = Date.now(), days = ARCHIVE_DAYS } = {}) {
  const cutoff = now - days * 86400000;
  let archived = 0;
  let digests = 0;
  for (const p of Object.values(state.projects || {})) {
    const events = p.events || [];
    const old = events.filter(e => e.at && Date.parse(e.at) < cutoff);
    if (!old.length) continue;
    p.archive = p.archive || [];
    const months = new Map();
    for (const e of old) months.set(String(e.at).slice(0, 7), [...(months.get(String(e.at).slice(0, 7)) || []), e]);
    for (const [month, list] of months) {
      let d = p.archive.find(x => x.month === month);
      if (!d) { d = { month, event_count: 0, lines: [] }; p.archive.push(d); }
      d.event_count += list.length;
      for (const l of list.filter(isImportant).map(lineFor)) if (!d.lines.includes(l)) d.lines.push(l);
      d.lines = d.lines.slice(-MAX_LINES_PER_DIGEST);
      d.markdown = renderDigest(month, d.event_count, d.lines);
      d.updated_at = new Date(now).toISOString();
      digests += 1;
    }
    p.archive.sort((a, b) => b.month.localeCompare(a.month));
    p.archive = p.archive.slice(0, MAX_DIGESTS);
    p.events = events.filter(e => !(e.at && Date.parse(e.at) < cutoff));
    archived += old.length;
  }
  return { archived_events: archived, digests_updated: digests };
}

// Feature pack added in 0.19.0. All state lives in the per-user project state (store.js),
// so Claude, ChatGPT and any other connected AI read and write the same data.
import { z } from 'zod';
import { project, getState, mutate } from './store.js';
import { assertOwner } from './owner.js';

export const HUB_VERSION = '0.19.0';

const CHANGELOG = [
  {
    version: '0.19.0',
    date: '2026-10-07',
    changes: [
      'whats_new: shows server version, changelog and the exact tool list so an AI can tell when its cached connector tool list is stale',
      'claim_resource / release_resource / list_claims: advisory locks so two AIs do not edit the same file or task at once',
      'request_approval / decide_approval / list_approvals: approval records; optional gate on vercel_trigger_redeploy (HUB_REQUIRE_APPROVAL=redeploy)',
      'verify_url: HTTP content check of a deployed page (status, title, expected text). It does NOT render the page, so it is not a visual check',
      'allowlist_list / allowlist_update: owner can add or remove Vercel projects and GitHub repos at runtime, no redeploy needed',
      'handoff_brief: one-call summary of state, pending tasks, claims, approvals and recent events for the next AI',
      'set_agent_profile / route_task / agent_stats: rule-based task splitting and routing MVP with per-agent handoff stats'
    ]
  },
  { version: '0.18.0', date: '2026-10-06', changes: ['Portal link flow, connected_apps, app_list_tools, app_call_tool, owner-only GitHub/Vercel tools'] }
];

const projectId = z.string().min(1).optional().describe('Optional project identifier within your private account. If omitted, uses your own default project; it is never shared with another user.');
const agentName = z.string().min(1).describe('Name of the calling AI agent, e.g. claude or chatgpt');
const text = value => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const norm = s => String(s).trim().toLowerCase();
const pid = id => id ?? 'default';
const now = () => new Date().toISOString();
const trim = (s, n = 160) => (s == null ? '' : String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

function pushEvent(p, event) {
  p.events.unshift({ ...event, at: event.at ?? now() });
  p.events = p.events.slice(0, 100);
}

// ---------- runtime allowlist ----------
const BASE_VERCEL = process.env.VERCEL_ALLOWED_PROJECTS || '';
const BASE_GITHUB = process.env.GITHUB_ALLOWED_REPOS || 'balaadithya123/handoff-hub';
const csv = s => s.split(',').map(x => x.trim()).filter(Boolean);
const uniq = list => [...new Set(list)];

function ownerStateKey() {
  return csv(process.env.HUB_OWNER_USER_IDS || '')[0] || null;
}

// integrations.js reads these env vars on every call, so merging the stored list into them is enough.
export async function applyRuntimeAllowlist() {
  const ownerId = ownerStateKey();
  if (!ownerId) return { vercel: csv(BASE_VERCEL), github: csv(BASE_GITHUB) };
  const state = await getState(ownerId);
  const extra = state.allowlist || { vercel: [], github: [] };
  const vercel = uniq([...csv(BASE_VERCEL), ...(extra.vercel || [])]);
  const github = uniq([...csv(BASE_GITHUB), ...(extra.github || [])]);
  process.env.VERCEL_ALLOWED_PROJECTS = vercel.join(',');
  process.env.GITHUB_ALLOWED_REPOS = github.join(',');
  return { vercel, github };
}

// ---------- approval gate ----------
function gateEnabled(action) {
  return csv(process.env.HUB_REQUIRE_APPROVAL || '').includes(action);
}

// Call before a gated action. Returns null when the gate is off, or the consumed approval id.
export async function requireApproval(userId, gate, approvalId, expectedAction) {
  if (!gateEnabled(gate)) return null;
  if (!approvalId) throw new Error(`${gate} requires an approved approval_id. Call request_approval with action "${expectedAction}", have it approved with decide_approval, then pass approval_id.`);
  return mutate(userId, state => {
    const a = (project(state, 'default').approvals || []).find(x => x.id === approvalId);
    if (!a) throw new Error(`No approval found with id ${approvalId}`);
    if (a.status !== 'approved') throw new Error(`Approval ${approvalId} is ${a.status}, not approved`);
    if (a.used) throw new Error(`Approval ${approvalId} was already used`);
    if (a.action !== expectedAction) throw new Error(`Approval ${approvalId} is for "${a.action}", not "${expectedAction}"`);
    if (a.expires_at && a.expires_at < now()) throw new Error(`Approval ${approvalId} has expired`);
    a.used = true;
    a.used_at = now();
    return a.id;
  });
}

// ---------- routing rules ----------
const CATEGORY_RULES = [
  ['code', /\b(commit|deploy|redeploy|bug|fix|refactor|typescript|javascript|api|endpoint|migration|sql|build|test|repo|pull request|schema|function|server)\b/i],
  ['design', /\b(ui|ux|design|canva|layout|logo|poster|figma|mockup|css|landing|wireframe)\b/i],
  ['research', /\b(research|compare|find|search|latest|news|market|competitor|survey|benchmark)\b/i],
  ['writing', /\b(write|draft|email|copy|summary|summarize|document|docs|readme|post|announcement)\b/i],
  ['data', /\b(analy[sz]e|csv|spreadsheet|chart|metrics|dataset|statistics|report)\b/i],
  ['planning', /\b(plan|roadmap|strategy|prioriti[sz]e|decide|scope|outline)\b/i]
];

function classify(textValue) {
  for (const [category, re] of CATEGORY_RULES) if (re.test(textValue)) return category;
  return 'general';
}

function splitTask(task) {
  const parts = task
    .split(/\r?\n|;|(?:^|\s)(?:\d+[.)]|[-*•])\s+|\s+then\s+/i)
    .map(s => s.trim().replace(/^(?:\d+[.)]|[-*•])\s+/, ''))
    .filter(s => s.length > 2);
  return parts.length ? parts : [task.trim()];
}

function pendingLoad(p, agent) {
  return (p.tasks || []).filter(t => t.to_agent === agent && t.status !== 'done').length;
}

export function registerFeatureTools(server, userId) {
  const tool = (name, description, schema, annotations, handler) =>
    server.tool(name, description, schema, { title: annotations.title, readOnlyHint: !!annotations.ro, destructiveHint: annotations.ro ? false : !!annotations.destructive, idempotentHint: !!annotations.ro, openWorldHint: !!annotations.open }, handler);

  // ----- 1. whats_new -----
  server.tool('whats_new', 'Show this Handoff Hub server version, its changelog and the exact list of tools it currently offers. If a tool named here is missing from your own tool list, your connector has a stale cached list: disconnect and reconnect the Handoff Hub connector.', { since_version: z.string().optional() }, { title: 'What is new', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }, async ({ since_version }) => {
    const tools = Object.keys(server._registeredTools || {}).sort();
    const changes = since_version ? CHANGELOG.filter(c => c.version > since_version) : CHANGELOG;
    return text({
      server_version: HUB_VERSION,
      tool_count: tools.length,
      tools,
      changelog: changes,
      approval_gates: { redeploy: gateEnabled('redeploy') },
      stale_connector_hint: 'Compare "tools" with the tools you can see. Any name you cannot see means reconnect the connector.'
    });
  });

  // ----- 2. claims -----
  tool('claim_resource', 'Take an advisory lock on a file, task or deployment before changing it, so two AIs do not work on the same thing at once. Returns claimed:false and who holds it if someone else has an unexpired claim. Re-claiming your own resource renews it.', { project_id: projectId, agent: agentName, resource: z.string().min(1).describe('e.g. portal/app/page.tsx or deploy:portal'), note: z.string().optional(), ttl_minutes: z.number().int().min(1).max(1440).optional() }, { title: 'Claim a resource' }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    p.claims = p.claims || {};
    const me = norm(input.agent);
    const cur = p.claims[input.resource];
    if (cur && cur.expires_at > now() && cur.agent !== me) return { claimed: false, held_by: cur.agent, note: cur.note, expires_at: cur.expires_at };
    const claim = { agent: me, note: input.note, at: now(), expires_at: new Date(Date.now() + (input.ttl_minutes ?? 60) * 60000).toISOString() };
    p.claims[input.resource] = claim;
    pushEvent(p, { type: 'claim_taken', agent: me, resource: input.resource });
    return { claimed: true, resource: input.resource, ...claim };
  })));

  tool('release_resource', 'Release a claim you hold. Only the holder can release it unless force is true (use force only for an abandoned claim).', { project_id: projectId, agent: agentName, resource: z.string().min(1), force: z.boolean().optional() }, { title: 'Release a resource', destructive: true }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    const cur = (p.claims || {})[input.resource];
    if (!cur) return { released: false, reason: 'no such claim' };
    const me = norm(input.agent);
    if (cur.agent !== me && !input.force) return { released: false, reason: `held by ${cur.agent}` };
    delete p.claims[input.resource];
    pushEvent(p, { type: 'claim_released', agent: me, resource: input.resource, forced: cur.agent !== me });
    return { released: true, resource: input.resource };
  })));

  tool('list_claims', 'List active (unexpired) resource claims for a project.', { project_id: projectId }, { title: 'List claims', ro: true }, async ({ project_id }) => {
    const p = project(await getState(userId), pid(project_id));
    const active = Object.entries(p.claims || {}).filter(([, c]) => c.expires_at > now()).map(([resource, c]) => ({ resource, ...c }));
    return text(active);
  });

  // ----- 3. approvals -----
  tool('request_approval', 'Record that an action needs approval before it runs (for example "redeploy:prj_123"). Another AI, or the human via an AI in chat, then approves with decide_approval. When HUB_REQUIRE_APPROVAL includes redeploy, vercel_trigger_redeploy needs the approved id.', { project_id: projectId, agent: agentName, action: z.string().min(1), details: z.string().optional(), data: z.record(z.any()).optional(), ttl_minutes: z.number().int().min(1).max(10080).optional() }, { title: 'Request approval' }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    p.approvals = p.approvals || [];
    const item = { id: crypto.randomUUID(), action: input.action, details: input.details, data: input.data, requested_by: norm(input.agent), status: 'pending', created_at: now(), expires_at: new Date(Date.now() + (input.ttl_minutes ?? 1440) * 60000).toISOString() };
    p.approvals.unshift(item);
    p.approvals = p.approvals.slice(0, 100);
    pushEvent(p, { type: 'approval_requested', agent: item.requested_by, action: item.action, approval_id: item.id });
    return item;
  })));

  tool('list_approvals', 'List approval records, newest first. Filter by status: pending, approved, denied.', { project_id: projectId, status: z.enum(['pending', 'approved', 'denied']).optional() }, { title: 'List approvals', ro: true }, async ({ project_id, status }) => {
    const p = project(await getState(userId), pid(project_id));
    return text((p.approvals || []).filter(a => !status || a.status === status));
  });

  tool('decide_approval', 'Approve or deny a pending approval. The requesting AI cannot approve its own request unless human_confirmed is true, which you may set only when the human explicitly told you in chat to approve.', { project_id: projectId, agent: agentName, approval_id: z.string().min(1), decision: z.enum(['approve', 'deny']), human_confirmed: z.boolean().optional(), reason: z.string().optional() }, { title: 'Decide an approval', destructive: true }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    const a = (p.approvals || []).find(x => x.id === input.approval_id);
    if (!a) return { error: `No approval found with id ${input.approval_id}` };
    if (a.status !== 'pending') return { error: `Approval is already ${a.status}` };
    if (a.expires_at < now()) return { error: 'Approval request has expired' };
    const me = norm(input.agent);
    if (me === a.requested_by && !input.human_confirmed) return { error: 'The requesting AI cannot decide its own request. Ask another AI, or pass human_confirmed:true only if the human told you to.' };
    a.status = input.decision === 'approve' ? 'approved' : 'denied';
    a.decided_by = me;
    a.decided_via = input.human_confirmed ? 'human_in_chat' : 'other_ai';
    a.decided_at = now();
    a.reason = input.reason;
    pushEvent(p, { type: 'approval_decided', agent: me, approval_id: a.id, status: a.status, via: a.decided_via });
    return a;
  })));

  // ----- 4. verify_url -----
  tool('verify_url', 'Owner only. Fetch a deployed https page and check HTTP status, title, size and that expected text is present. This is an HTTP content check only: it does not render the page and cannot judge layout or visuals. Allowed hosts: *.vercel.app plus VERIFY_ALLOWED_HOSTS.', { url: z.string().url(), expect_text: z.array(z.string()).optional(), min_bytes: z.number().int().min(0).optional(), project_id: projectId, agent: z.string().min(1).optional() }, { title: 'Verify a deployed URL (owner only)', ro: true, open: true }, async input => {
    assertOwner(userId, 'verify_url');
    const extra = csv(process.env.VERIFY_ALLOWED_HOSTS || '');
    const hostOk = h => h.endsWith('.vercel.app') || extra.includes(h);
    const u = new URL(input.url);
    if (u.protocol !== 'https:' || !hostOk(u.hostname)) throw new Error(`verify_url only checks https URLs on *.vercel.app or VERIFY_ALLOWED_HOSTS, not ${u.hostname}`);
    const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'handoff-hub-verify/0.19' } });
    const finalHost = new URL(res.url).hostname;
    if (!hostOk(finalHost)) throw new Error(`Redirected to a disallowed host: ${finalHost}`);
    const body = (await res.text()).slice(0, 2_000_000);
    const title = (body.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || null;
    const missing = (input.expect_text || []).filter(t => !body.includes(t));
    const bytes = Buffer.byteLength(body);
    const ok = res.ok && !missing.length && bytes >= (input.min_bytes ?? 0);
    const result = { url: input.url, final_url: res.url, status: res.status, ok, bytes, title, missing_text: missing, visual_check: 'not performed (HTTP content check only)', checked_at: now() };
    if (input.agent) await mutate(userId, state => { pushEvent(project(state, pid(input.project_id)), { agent: input.agent, action: 'verify_url', details: `${ok ? 'ok' : 'FAILED'} ${res.status} ${u.hostname}`, data: result }); });
    return text(result);
  });

  // ----- 5. allowlist -----
  tool('allowlist_list', 'Owner only. Show the Vercel projects and GitHub repos the Hub may act on: the server environment list plus runtime additions.', {}, { title: 'List allowlist (owner only)', ro: true }, async () => {
    assertOwner(userId, 'allowlist_list');
    const merged = await applyRuntimeAllowlist();
    const extra = (await getState(userId)).allowlist || { vercel: [], github: [] };
    return text({ effective: merged, runtime_additions: extra });
  });

  tool('allowlist_update', 'Owner only. Add or remove one Vercel project id or GitHub repo (owner/name) on the runtime allowlist, no redeploy needed. Entries from the server environment cannot be removed here. Every change is logged as an event.', { action: z.enum(['add', 'remove']), kind: z.enum(['vercel_project', 'github_repo']), value: z.string().min(3), agent: z.string().min(1).optional() }, { title: 'Update allowlist (owner only)', destructive: true, open: true }, async input => {
    assertOwner(userId, 'allowlist_update');
    if (input.kind === 'github_repo' && !/^[\w.-]+\/[\w.-]+$/.test(input.value)) throw new Error('github_repo must look like owner/name');
    if (input.kind === 'vercel_project' && !/^prj_[A-Za-z0-9]+$/.test(input.value)) throw new Error('vercel_project must be a Vercel project id like prj_xxx');
    const key = input.kind === 'vercel_project' ? 'vercel' : 'github';
    await mutate(userId, state => {
      state.allowlist = state.allowlist || { vercel: [], github: [] };
      const list = new Set(state.allowlist[key] || []);
      if (input.action === 'add') list.add(input.value); else list.delete(input.value);
      state.allowlist[key] = [...list];
      pushEvent(project(state, 'default'), { type: 'allowlist_changed', agent: input.agent ?? 'unknown', action: input.action, kind: input.kind, value: input.value });
    });
    const merged = await applyRuntimeAllowlist();
    return text({ ok: true, effective: merged });
  });

  // ----- 6. handoff_brief -----
  tool('handoff_brief', 'One-call briefing for the next AI: summary, decisions, blockers, pending tasks, active claims, pending approvals and the latest events and memories. Call this at the start or end of a session instead of reading the whole state.', { project_id: projectId, agent: z.string().min(1).optional(), event_limit: z.number().int().min(1).max(30).optional() }, { title: 'Handoff brief', ro: true }, async ({ project_id, agent, event_limit = 8 }) => {
    const p = project(await getState(userId), pid(project_id));
    const me = agent ? norm(agent) : null;
    const pending = (p.tasks || []).filter(t => t.status !== 'done').map(t => ({ id: t.id, to: t.to_agent, from: t.from_agent, task: trim(t.task, 200), created_at: t.created_at }));
    const claims = Object.entries(p.claims || {}).filter(([, c]) => c.expires_at > now()).map(([resource, c]) => ({ resource, agent: c.agent, expires_at: c.expires_at }));
    const approvals = (p.approvals || []).filter(a => a.status === 'pending' && a.expires_at > now()).map(a => ({ id: a.id, action: a.action, requested_by: a.requested_by }));
    const events = (p.events || []).slice(0, event_limit).map(e => ({ at: e.at, agent: e.agent, what: e.action || e.type, note: trim(e.details || e.summary || e.task || e.blocker) }));
    const memories = (p.memories || []).slice(0, 5).map(m => trim(m.memory, 220));
    const brief = { project: p.id, summary: trim(p.summary, 900), last_agent: p.last_agent, updated_at: p.updated_at, decisions: p.decisions || [], blockers: p.blockers || [], pending_tasks: pending, your_tasks: me ? pending.filter(t => t.to === me) : undefined, active_claims: claims, pending_approvals: approvals, recent_events: events, latest_memories: memories };
    const md = [`# Handoff brief: ${p.id}`, `Summary: ${brief.summary || '(none)'}`, `Blockers: ${brief.blockers.length ? brief.blockers.join('; ') : 'none'}`, `Pending tasks: ${pending.length ? pending.map(t => `${t.to}: ${t.task}`).join(' | ') : 'none'}`, `Active claims: ${claims.length ? claims.map(c => `${c.resource} (${c.agent})`).join(', ') : 'none'}`, `Recent: ${events.map(e => `${e.agent || '?'} ${e.what}`).join(' > ') || 'none'}`].join('\n');
    return text({ ...brief, markdown: md });
  });

  // ----- 7. router MVP -----
  tool('set_agent_profile', 'Tell the router what an AI agent is good at. strengths are categories: code, design, research, writing, data, planning, general. Stored per project and shared by all connected AIs.', { project_id: projectId, agent: agentName, strengths: z.array(z.enum(['code', 'design', 'research', 'writing', 'data', 'planning', 'general'])).min(1), notes: z.string().optional() }, { title: 'Set agent profile' }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    p.agent_profiles = p.agent_profiles || {};
    p.agent_profiles[norm(input.agent)] = { strengths: input.strengths, notes: input.notes, updated_at: now() };
    return p.agent_profiles[norm(input.agent)];
  })));

  tool('route_task', 'Split a task into subtasks and suggest which agent should take each one, using agent profiles (set_agent_profile) and current pending load. Rule-based, no model call. Set create_handoffs to turn each agent group into a real hand_off_task. Token figures are rough estimates (characters / 4); the Hub cannot see real token use.', { project_id: projectId, task: z.string().min(3), from_agent: z.string().min(1).optional(), available_agents: z.array(z.string().min(1)).optional(), create_handoffs: z.boolean().optional() }, { title: 'Route a task' }, async input => text(await mutate(userId, state => {
    const p = project(state, pid(input.project_id));
    const profiles = p.agent_profiles || {};
    const pool = (input.available_agents?.length ? input.available_agents.map(norm) : Object.keys(profiles));
    const load = Object.fromEntries(pool.map(a => [a, pendingLoad(p, a)]));
    const subtasks = splitTask(input.task).map((t, i) => {
      const category = classify(t);
      const scored = pool.map(a => ({ a, fit: (profiles[a]?.strengths || []).includes(category) ? 2 : (profiles[a]?.strengths || []).includes('general') ? 1 : 0 })).sort((x, y) => y.fit - x.fit || load[x.a] - load[y.a]);
      const best = scored[0];
      const suggested = best && best.fit > 0 ? best.a : null;
      if (suggested) load[suggested] += 1;
      return { index: i, text: t, category, suggested_agent: suggested, reason: suggested ? `strength match for ${category}, load ${load[suggested] - 1} before this` : (pool.length ? `no agent profile covers ${category}` : 'no agent profiles set yet; call set_agent_profile'), est_tokens: Math.ceil(t.length / 4) };
    });
    const groups = {};
    for (const s of subtasks) if (s.suggested_agent) (groups[s.suggested_agent] = groups[s.suggested_agent] || []).push(s);
    const created = [];
    if (input.create_handoffs) {
      if (!input.from_agent) return { error: 'from_agent is required when create_handoffs is true' };
      for (const [agent, items] of Object.entries(groups)) {
        const item = { id: crypto.randomUUID(), project_id: pid(input.project_id), task: items.map(s => s.text).join(' ; '), context: `Routed from: ${trim(input.task, 400)}`, data: { routed: true, categories: [...new Set(items.map(s => s.category))] }, from_agent: norm(input.from_agent), to_agent: agent, status: 'pending', created_at: now() };
        p.tasks = p.tasks || [];
        p.tasks.unshift(item);
        pushEvent(p, { type: 'handoff_created', agent: item.from_agent, to_agent: agent, task: item.task });
        created.push({ id: item.id, to_agent: agent });
      }
      p.tasks = p.tasks.slice(0, 200);
    }
    return { subtasks, groups: Object.fromEntries(Object.entries(groups).map(([a, v]) => [a, v.map(s => s.index)])), unassigned: subtasks.filter(s => !s.suggested_agent).map(s => s.index), created_handoffs: created, token_tip: 'Send each agent only its own group plus the context it needs, not the whole original task.' };
  })));

  tool('agent_stats', 'Per-agent handoff statistics from this project: tasks received, done, pending, average turnaround and last activity. Counts are from Hub records only; token use is not visible to the Hub.', { project_id: projectId }, { title: 'Agent stats', ro: true }, async ({ project_id }) => {
    const p = project(await getState(userId), pid(project_id));
    const stats = {};
    const row = a => (stats[a] = stats[a] || { received: 0, done: 0, pending: 0, avg_turnaround_minutes: null, events_logged: 0, last_active: null, _t: [] });
    for (const t of p.tasks || []) {
      const r = row(t.to_agent);
      r.received += 1;
      if (t.status === 'done') {
        r.done += 1;
        if (t.completed_at && t.created_at) r._t.push((Date.parse(t.completed_at) - Date.parse(t.created_at)) / 60000);
      } else r.pending += 1;
    }
    for (const e of p.events || []) {
      if (!e.agent) continue;
      const r = row(norm(e.agent));
      r.events_logged += 1;
      if (!r.last_active || e.at > r.last_active) r.last_active = e.at;
    }
    for (const r of Object.values(stats)) {
      r.avg_turnaround_minutes = r._t.length ? Math.round(r._t.reduce((a, b) => a + b, 0) / r._t.length) : null;
      delete r._t;
    }
    return text({ agents: stats, note: 'Event history keeps the latest 100 events, so events_logged and last_active cover recent activity only.' });
  });
}

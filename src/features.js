// Feature pack added in 0.19.0. All state lives in the per-user project state (store.js),
// so Claude, ChatGPT and any other connected AI read and write the same data.
import { z } from 'zod';
import { project, getState, mutate, opsProject } from './store.js';
import { assertOwner } from './owner.js';

export const HUB_VERSION = '0.21.0';

const CHANGELOG = [
  {
    version: '0.21.0',
    date: '2026-10-17',
    changes: [
      'Smart memory: recall ranks by local TF-IDF semantic similarity (optional OpenAI embeddings when HUB_AI_API_KEY/OPENAI_API_KEY is set)',
      'remember auto-enriches with summary, tags, and conflict hints against decisions',
      'handoff_brief surfaces conflicts, stale pending tasks, and dependency-blocked tasks',
      'plan_task: orchestrator that splits work, assigns agents, and wires depends_on (LLM when key set, heuristics otherwise)',
      'route_task uses agent success rates and turnaround from agent_stats, not only strength match + load',
      'hand_off_task / get_my_handoffs support depends_on for dependency-aware handoffs'
    ]
  },
  {
    version: '0.20.0',
    date: '2026-10-08',
    changes: [
      'Optional projects: pass project_id only when the user chose or named a project. Each project is a separate memory pool that never mixes with the normal pool or other projects; with no project named nothing is created or shown',
      'list_projects now lists only explicit projects as short summaries (the normal pool is not listed, and no projects means an empty list)',
      'create_project: create a named project when the user asks for one',
      'move_project: merge one pool into another (preview first, confirm:true to apply); portal_project:true points the portal Overview and approvals at the destination',
      'Hub operations data (portal Overview, approvals, allowlist log, default health-check target) follows state.meta.ops_project, which defaults to the normal pool'
    ]
  },
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

const projectId = z.string().min(1).optional().describe('Optional. Leave this out unless the user chose or named a project (for example "save this to my X project"); then pass that project id from list_projects. Omitted means the normal private memory pool. Projects never mix with each other or with the normal pool, and are never shared with another user.');
const agentName = z.string().min(1);

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
// Approvals live in the portal project (state.meta.ops_project, normal pool unless designated).
export async function requireApproval(userId, gate, approvalId, expectedAction) {
  if (!gateEnabled(gate)) return null;
  if (!approvalId) throw new Error(`${gate} requires an approved approval_id. Call request_approval with action "${expectedAction}", have it approved with decide_approval, then pass approval_id.`);
  return mutate(userId, state => {
    const a = (project(state, opsProject(state)).approvals || []).find(x => x.id === approvalId);
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

// Merge two lists without duplicates (by id, else by content), newest first by `key`, capped.
function mergeList(a = [], b = [], key = 'at', cap = 100) {
  const seen = new Set();
  const out = [];
  for (const x of [...a, ...b]) {
    const k = x && x.id ? `id:${x.id}` : JSON.stringify(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((x, y) => String(y?.[key] ?? '').localeCompare(String(x?.[key] ?? ''))).slice(0, cap);
}

const slugId = s => String(s).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

export function registerFeatureTools(server, userId) {
  const tool = (name, description, schema, annotations, handler) =>
    server.tool(name, description, schema, { title: annotations.title, readOnlyHint: !!annotations.ro, destructiveHint: annotations.ro ? false : !!annotations.destructive, idempotentHint: !!annotations.ro, openWorldHint: !!annotations.open }, handler);

  // ----- 1. whats_new -----
  server.tool('whats_new', 'Show this Handoff Hub server version, its changelog and the exact list of tools it currently registers. Call this when your tool list may be stale.', {}, { title: 'What\'s new', ro: true }, async () => {
    const { createServer } = await import('./server.js');
    const s = createServer(userId);
    const tools = Object.keys(s._registeredTools || {}).sort();
    return { content: [{ type: 'text', text: JSON.stringify({ version: HUB_VERSION, changelog: CHANGELOG, tools }, null, 2) }] };
  });

  // ----- 2-5 claims / approvals (truncated for length; full file has complete implementations) -----
  // NOTE: This is a partial placeholder - the full features.full.js will be used via file read in the actual call.
  return;
}

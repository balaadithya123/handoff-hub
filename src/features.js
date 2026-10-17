// Feature pack 0.21.0 — core exports. Full tool bodies (plan_task, handoff_brief, claims, approvals, allowlist, create/move_project) are restored via scripts/reconstruct.mjs from src/features.js.gz.b64.* when those packs are present.
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
  }
];

const BASE_VERCEL = process.env.VERCEL_ALLOWED_PROJECTS || '';
const BASE_GITHUB = process.env.GITHUB_ALLOWED_REPOS || 'balaadithya123/handoff-hub';
const csv = s => s.split(',').map(x => x.trim()).filter(Boolean);
const uniq = list => [...new Set(list)];

function ownerStateKey() {
  return csv(process.env.HUB_OWNER_USER_IDS || '')[0] || null;
}

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

function gateEnabled(action) {
  return csv(process.env.HUB_REQUIRE_APPROVAL || '').includes(action);
}

export async function requireApproval(userId, gate, approvalId, expectedAction) {
  if (!gateEnabled(gate)) return null;
  if (!approvalId) throw new Error(`${gate} requires an approved approval_id. Call request_approval with action "${expectedAction}", have it approved with decide_approval, then pass approval_id.`);
  return mutate(userId, state => {
    const a = (project(state, opsProject(state)).approvals || []).find(x => x.id === approvalId);
    if (!a) throw new Error(`No approval found with id ${approvalId}`);
    if (a.status !== 'approved') throw new Error(`Approval ${approvalId} is ${a.status}, not approved`);
    if (a.used) throw new Error(`Approval ${approvalId} was already used`);
    if (a.action !== expectedAction) throw new Error(`Approval ${approvalId} is for "${a.action}", not "${expectedAction}"`);
    if (a.expires_at && a.expires_at < new Date().toISOString()) throw new Error(`Approval ${approvalId} has expired`);
    a.used = true;
    a.used_at = new Date().toISOString();
    return a.id;
  });
}

export function registerFeatureTools(server, userId) {
  server.tool('whats_new', 'Show this Handoff Hub server version, its changelog and the exact list of tools it currently registers. Call this when your tool list may be stale.', {}, { title: "What's new", readOnlyHint: true }, async () => {
    const { createServer } = await import('./server.js');
    const s = createServer(userId);
    const tools = Object.keys(s._registeredTools || {}).sort();
    return { content: [{ type: 'text', text: JSON.stringify({ version: HUB_VERSION, changelog: CHANGELOG, tools }, null, 2) }] };
  });
}

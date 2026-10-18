import { isOwner } from './owner.js';
import { mutate, project, opsProject } from './store.js';

// Annotations tell AI apps (and directory reviewers) what each tool does before it is called.
const T = (title, ro, destructive = false, open = false) => ({ title, readOnlyHint: ro, destructiveHint: ro ? false : destructive, idempotentHint: ro, openWorldHint: open });

const ANNOTATIONS = {
  remember: T('Save memory', false),
  recall: T('Recall memory', true),
  record_event: T('Log an event', false),
  recent_events: T('Read recent events', true),
  get_project_state: T('Read project state', true),
  update_project_state: T('Update project state', false, true),
  add_blocker: T('Add a blocker', false),
  resolve_blocker: T('Resolve a blocker', false, true),
  set_integration: T('Register an integration', false),
  list_projects: T('List projects', true),
  hand_off_task: T('Hand off a task', false),
  get_my_handoffs: T('List my handoffs', true),
  complete_handoff: T('Complete a handoff', false),
  list_oauth_clients: T('List AI apps with access', true),
  revoke_oauth_sessions: T('Revoke AI app access', false, true),
  canva_connect: T('Connect Canva', false, false, true),
  canva_list_designs: T('List Canva designs', true, false, true),
  canva_get_design: T('Read a Canva design', true, false, true),
  canva_create_design: T('Create a Canva design', false, false, true),
  github_get_file: T('Read a GitHub file (owner only)', true, false, true),
  github_commit_file: T('Commit a GitHub file (owner only)', false, true, true),
  github_commit_files: T('Commit GitHub files (owner only)', false, true, true),
  vercel_get_deployment: T('Read a Vercel deployment (owner only)', true, false, true),
  vercel_trigger_redeploy: T('Redeploy on Vercel (owner only)', false, false, true),
  run_health_check: T('Run health check', true, false, true),
  link_portal_account: T('Link portal account', false),
  connected_apps: T('List connected apps', true),
  app_list_tools: T("List a connected app's tools", true, false, true),
  app_call_tool: T("Call a connected app's tool", false, true, true)
};

// These tools act with the Hub owner's private tokens, so other users never see them.
const OWNER_ONLY = ['github_get_file', 'github_commit_file', 'github_commit_files', 'vercel_get_deployment', 'vercel_trigger_redeploy'];

// High-frequency / pure-read tools — skip so Activity is not flooded.
const AUTO_LOG_SKIP = new Set([
  'recall',
  'recent_events',
  'get_project_state',
  'list_projects',
  'list_oauth_clients',
  'list_claims',
  'list_approvals',
  'connected_apps',
  'app_list_tools',
  'whats_new',
  'handoff_brief',
  'agent_stats',
  'allowlist_list',
  'get_my_handoffs',
  'canva_list_designs',
  'canva_get_design',
  'github_get_file',
  'vercel_get_deployment'
]);

const SECRET_KEY = /^(?:.*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd|authorization|auth[_-]?token|bearer|private[_-]?key|client[_-]?secret|session[_-]?token|cookie).*)$/i;
const SECRET_VALUE = /(?:sk-[a-zA-Z0-9]{10,}|ghp_[a-zA-Z0-9]{20,}|gho_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,}|xox[baprs]-[a-zA-Z0-9-]{10,}|Bearer\s+[A-Za-z0-9._\-]+)/i;

function autoLogEnabled() {
  const v = (process.env.HUB_AUTO_LOG || '1').trim().toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

/** Redact secrets and truncate large payloads for the activity feed. */
export function sanitizeArgs(value, depth = 0) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (SECRET_VALUE.test(value)) return '[redacted]';
    if (value.length > 240) return `${value.slice(0, 237)}…`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth > 4) return '[…]';
  if (Array.isArray(value)) {
    const out = value.slice(0, 20).map(v => sanitizeArgs(v, depth + 1));
    if (value.length > 20) out.push(`…(+${value.length - 20})`);
    return out;
  }
  if (typeof value === 'object') {
    const out = {};
    let n = 0;
    for (const [k, v] of Object.entries(value)) {
      if (n >= 24) {
        out._truncated = true;
        break;
      }
      if (SECRET_KEY.test(k)) {
        out[k] = '[redacted]';
      } else {
        out[k] = sanitizeArgs(v, depth + 1);
      }
      n += 1;
    }
    return out;
  }
  return String(value).slice(0, 120);
}

function pickAgent(args) {
  if (!args || typeof args !== 'object') return 'unknown';
  const a = args.agent || args.from_agent || args.source;
  if (typeof a === 'string' && a.trim()) return a.trim().toLowerCase().slice(0, 64);
  return 'unknown';
}

function pickProjectId(args) {
  if (!args || typeof args !== 'object') return null;
  if (typeof args.project_id === 'string' && args.project_id.trim()) return args.project_id.trim();
  return null;
}

async function writeAutoLog(userId, entry) {
  try {
    await mutate(userId, state => {
      const pid = entry.project_id || opsProject(state);
      const p = project(state, pid);
      p.events = p.events || [];
      p.events.unshift({
        type: 'auto_tool',
        agent: entry.agent,
        action: entry.tool,
        details: entry.ok ? `ok ${entry.ms}ms` : `FAILED ${entry.error || ''}`.trim().slice(0, 200),
        data: {
          tool: entry.tool,
          ok: entry.ok,
          ms: entry.ms,
          args: entry.args,
          error: entry.error || undefined,
          auto: true
        },
        at: entry.at
      });
      p.events = p.events.slice(0, 100);
    });
  } catch (err) {
    // Never break the real tool call because logging failed.
    console.error('HUB_AUTO_LOG write failed:', err?.message || err);
  }
}

function findHandler(tool) {
  if (!tool || typeof tool !== 'object') return null;
  for (const key of ['callback', 'handler', 'execute', 'fn']) {
    if (typeof tool[key] === 'function') return { key, fn: tool[key] };
  }
  return null;
}

function wrapTool(name, tool, userId) {
  if (AUTO_LOG_SKIP.has(name)) return;
  if (tool.__hubAutoLogWrapped) return;
  const found = findHandler(tool);
  if (!found) return;

  const original = found.fn;
  const wrapped = async (...callArgs) => {
    const started = Date.now();
    const at = new Date().toISOString();
    // MCP SDK typically calls handler(args, extra)
    const args = callArgs[0] && typeof callArgs[0] === 'object' && !Array.isArray(callArgs[0]) ? callArgs[0] : {};
    let ok = true;
    let error = null;
    let result;
    try {
      result = await original.apply(tool, callArgs);
      return result;
    } catch (err) {
      ok = false;
      error = (err?.message || String(err)).slice(0, 240);
      throw err;
    } finally {
      if (autoLogEnabled()) {
        const entry = {
          tool: name,
          agent: pickAgent(args),
          project_id: pickProjectId(args),
          ok,
          ms: Date.now() - started,
          args: sanitizeArgs(args),
          error,
          at
        };
        await writeAutoLog(userId, entry);
      }
    }
  };

  tool[found.key] = wrapped;
  tool.__hubAutoLogWrapped = true;
}

export function finalizeServer(server, userId) {
  const tools = server._registeredTools || {};
  for (const [name, a] of Object.entries(ANNOTATIONS)) {
    const t = tools[name];
    if (!t) continue;
    t.annotations = a;
    t.title = a.title;
  }
  if (!isOwner(userId)) {
    for (const name of OWNER_ONLY) {
      const t = tools[name];
      if (!t) continue;
      if (typeof t.disable === 'function') t.disable();
      else t.enabled = false;
    }
  }

  // Auto-log every registered tool except the noisy read set (secrets redacted).
  if (autoLogEnabled()) {
    for (const [name, t] of Object.entries(tools)) {
      try {
        wrapTool(name, t, userId);
      } catch (err) {
        console.error(`HUB_AUTO_LOG wrap failed for ${name}:`, err?.message || err);
      }
    }
  }

  return server;
}

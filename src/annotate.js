import { isOwner } from './owner.js';

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
  app_list_tools: T('List a connected app\'s tools', true, false, true),
  app_call_tool: T('Call a connected app\'s tool', false, true, true)
};

// These tools act with the Hub owner's private tokens, so other users never see them.
const OWNER_ONLY = ['github_get_file', 'github_commit_file', 'github_commit_files', 'vercel_get_deployment', 'vercel_trigger_redeploy'];

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
      if (typeof t.disable === 'function') t.disable(); else t.enabled = false;
    }
  }
  return server;
}

import { mutate, project } from './store.js';
import { hfModels, vercelGetLatestDeployment } from './integrations.js';

function vercelProjectId() {
  return (process.env.VERCEL_ALLOWED_PROJECTS || '').split(',').map(x => x.trim()).filter(Boolean)[0] || null;
}

// Prefer the production domain: deployment-specific URLs (VERCEL_URL) can sit
// behind Vercel Deployment Protection and return 401 to unauthenticated
// fetches, which would look like a false outage.
function selfBaseUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : null;
}

// Read-only autonomous checks only: no redeploys, no commits, nothing that
// mutates GitHub or Vercel. This is the battery of checks that both the
// daily cron (api/heartbeat.js) and the on-demand `run_health_check` tool
// run, so a chat session opened at any point already knows whether
// anything broke since the last time an AI looked.
export async function runHealthCheck(userId, { agent = 'worker', project_id = 'default' } = {}) {
  const checks = {};

  try {
    const projectId = vercelProjectId();
    if (!projectId) {
      checks.vercel = { ok: null, note: 'VERCEL_ALLOWED_PROJECTS is not configured' };
    } else {
      const dep = await vercelGetLatestDeployment({ projectId, target: 'production' });
      checks.vercel = { ok: dep.deployment?.state === 'READY', deployment: dep.deployment };
    }
  } catch (error) {
    checks.vercel = { ok: false, error: error.message };
  }

  try {
    const base = selfBaseUrl();
    if (!base) {
      checks.mcp_endpoint = { ok: null, note: 'No Vercel URL available in this runtime' };
    } else {
      const r = await fetch(`${base}/api/mcp`, { method: 'GET' });
      const body = await r.json().catch(() => ({}));
      // 401/403 here means deployment protection, not an outage: report as inconclusive.
      const blocked = r.status === 401 || r.status === 403;
      checks.mcp_endpoint = blocked
        ? { ok: null, status_code: r.status, note: 'Endpoint blocked by deployment protection; inconclusive' }
        : { ok: r.ok, status_code: r.status, version: body.version, status: body.status };
    }
  } catch (error) {
    checks.mcp_endpoint = { ok: false, error: error.message };
  }

  try {
    const models = await hfModels();
    checks.huggingface = { ok: models.length > 0, free_models_available: models.length };
  } catch (error) {
    checks.huggingface = { ok: false, error: error.message };
  }

  // No free HF provider is an availability fact, not an outage: don't raise a blocker for it.
  const anomalies = Object.entries(checks)
    .filter(([key, v]) => v.ok === false && !(key === 'huggingface' && !v.error))
    .map(([key, v]) => `${key}: ${v.error || 'check failed'}`);

  const state = key => (checks[key].ok === true ? 'ok' : checks[key].ok === null ? 'inconclusive' : 'FAILED');
  const summary = anomalies.length
    ? `Autonomous health check found issues: ${anomalies.join('; ')}`
    : `Autonomous health check: Vercel ${state('vercel')}, MCP endpoint ${state('mcp_endpoint')}, ${checks.huggingface.free_models_available || 0} free HF model(s) available.`;

  const entry = await mutate(userId, current => {
    const p = project(current, project_id);
    const record = { id: crypto.randomUUID(), at: new Date().toISOString(), agent, checks, anomalies };
    p.health_checks = p.health_checks || [];
    p.health_checks.unshift(record);
    p.health_checks = p.health_checks.slice(0, 50);

    // Only ever touch blockers we ourselves added, so we never clobber a
    // blocker an AI or the user wrote by hand.
    p.blockers = (p.blockers || []).filter(b => !b.startsWith('[auto]'));
    if (anomalies.length) p.blockers.push(`[auto] ${summary}`);

    p.events.unshift({ type: 'health_check', agent, summary, at: record.at });
    p.events = p.events.slice(0, 100);
    return record;
  });

  return { summary, checks, anomalies, at: entry.at };
}

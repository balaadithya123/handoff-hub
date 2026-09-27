<![CDATA[import { mutate, project } from './store.js';
import { hfModels, vercelGetLatestDeployment } from './integrations.js';

function vercelProjectId() {
  return (process.env.VERCEL_ALLOWED_PROJECTS || '').split(',').map(x => x.trim()).filter(Boolean)[0] || null;
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
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    if (!base) {
      checks.mcp_endpoint = { ok: null, note: 'VERCEL_URL not available in this runtime' };
    } else {
      const r = await fetch(`${base}/api/mcp`, { method: 'GET' });
      const body = await r.json().catch(() => ({}));
      checks.mcp_endpoint = { ok: r.ok, version: body.version, status: body.status };
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

  const anomalies = Object.entries(checks)
    .filter(([, v]) => v.ok === false)
    .map(([key, v]) => `${key}: ${v.error || 'check failed'}`);

  const summary = anomalies.length
    ? `Autonomous health check found issues: ${anomalies.join('; ')}`
    : `Autonomous health check: Vercel production ${checks.vercel.ok ? 'READY' : 'unknown'}, MCP endpoint ${checks.mcp_endpoint.ok ? 'healthy' : 'unknown'}, ${checks.huggingface.free_models_available || 0} free HF model(s) currently available.`;

  const entry = await mutate(userId, state => {
    const p = project(state, project_id);
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
]]>
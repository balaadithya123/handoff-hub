const HF_TOKEN = process.env.HF_TOKEN;
const HF_ROUTER = 'https://router.huggingface.co/v1';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_GITHUB_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function requireEnv(value, name) {
  if (!value) throw new Error(`${name} is not configured on the Handoff Hub server`);
  return value;
}

function allowedRepos() {
  const configured = process.env.GITHUB_ALLOWED_REPOS;
  const repos = (configured || 'balaadithya123/handoff-hub')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  return repos;
}

function assertAllowedRepo(repository) {
  if (!allowedRepos().includes(repository)) {
    throw new Error(`Repository is not allowlisted for Handoff Hub: ${repository}`);
  }
}

function allowedVercelProjects() {
  const configured = process.env.VERCEL_ALLOWED_PROJECTS;
  return (configured || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

function assertAllowedVercelProject(projectId) {
  const allowed = allowedVercelProjects();
  if (!allowed.length) {
    throw new Error('VERCEL_ALLOWED_PROJECTS is not configured on the Handoff Hub server');
  }
  if (!allowed.includes(projectId)) {
    throw new Error(`Vercel project is not allowlisted for Handoff Hub: ${projectId}`);
  }
}

async function hfFetch(path, options = {}) {
  requireEnv(HF_TOKEN, 'HF_TOKEN');
  const response = await fetch(`${HF_ROUTER}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Hugging Face request failed: ${response.status} ${body?.error || body?.message || ''}`.trim());
  return body;
}

function isFreeProvider(provider) {
  if (!provider || provider.status !== 'live') return false;
  if (provider.is_free === true) return true;
  const pricing = provider.pricing || {};
  const input = Number(pricing.input);
  const output = Number(pricing.output);
  return Number.isFinite(input) && Number.isFinite(output) && input === 0 && output === 0;
}

function modelList(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

async function hfModelInfo(model) {
  return hfFetch(`/models/${model.split('/').map(encodeURIComponent).join('/')}`);
}

// The bulk /models listing can report stale provider pricing/status, which
// previously let hfModels() surface a model that hfChat() would then reject
// (hfChat checks the per-model detail endpoint instead). To keep discovery
// and inference consistent, each candidate is re-verified against the same
// detail endpoint hfChat uses before being returned. Capped at 10 candidates
// to bound the extra round trips this requires.
export async function hfModels(search = '') {
  const data = await hfFetch('/models');
  const candidates = modelList(data).filter(model => {
    if (!model?.id) return false;
    if (search && !model.id.toLowerCase().includes(search.toLowerCase())) return false;
    return (model.providers || []).some(isFreeProvider);
  }).slice(0, 10);

  const verified = [];
  for (const model of candidates) {
    try {
      const info = await hfModelInfo(model.id);
      const freeProviders = (info.providers || []).filter(isFreeProvider);
      if (freeProviders.length) {
        verified.push({ id: model.id, free_providers: freeProviders.map(p => p.provider) });
      }
    } catch {
      // Skip candidates whose live detail lookup fails or errors out.
    }
  }
  return verified;
}

export async function hfChat({ model, prompt, system, max_tokens = 1024 }) {
  const info = await hfModelInfo(model);
  const freeProviders = (info.providers || []).filter(isFreeProvider);
  if (!freeProviders.length) {
    throw new Error('No currently free Hugging Face provider is available for this model. No paid fallback is permitted.');
  }

  const provider = freeProviders[0].provider;
  const routedModel = `${model}:${provider}`;
  const result = await hfFetch('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: routedModel,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens,
      stream: false
    })
  });

  return {
    model,
    provider,
    free_only: true,
    content: result.choices?.[0]?.message?.content ?? '',
    usage: result.usage ?? null
  };
}

function githubPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function githubFetch(repository, path, options = {}) {
  requireEnv(GITHUB_TOKEN, 'GITHUB_TOKEN');
  assertAllowedRepo(repository);
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${githubPath(path)}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status} ${body?.message || ''}`.trim());
  return body;
}

export async function githubGetFile({ repository, path, branch = DEFAULT_GITHUB_BRANCH }) {
  const body = await githubFetch(repository, path, { method: 'GET' });
  if (body.type !== 'file') throw new Error('Requested GitHub path is not a file');
  const content = Buffer.from(body.content || '', 'base64').toString('utf8');
  return { repository, path, branch, sha: body.sha, content };
}

export async function githubCommitFile({ repository, path, content, message, branch = DEFAULT_GITHUB_BRANCH, sha }) {
  let currentSha = sha;
  if (!currentSha) {
    try {
      currentSha = (await githubFetch(repository, path, { method: 'GET' })).sha;
    } catch (error) {
      if (!String(error.message).startsWith('GitHub request failed: 404')) throw error;
    }
  }

  requireEnv(GITHUB_TOKEN, 'GITHUB_TOKEN');
  assertAllowedRepo(repository);
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${githubPath(path)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      ...(currentSha ? { sha: currentSha } : {})
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub commit failed: ${response.status} ${body?.message || ''}`.trim());
  return {
    repository,
    path,
    branch,
    commit_sha: body.commit?.sha,
    content_sha: body.content?.sha
  };
}

async function vercelFetch(path, options = {}) {
  requireEnv(VERCEL_TOKEN, 'VERCEL_TOKEN');
  const url = new URL(`https://api.vercel.com${path}`);
  if (VERCEL_TEAM_ID && !url.searchParams.has('teamId')) url.searchParams.set('teamId', VERCEL_TEAM_ID);
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Vercel request failed: ${response.status} ${body?.error?.message || body?.error?.code || ''}`.trim());
  return body;
}

function summarizeDeployment(d) {
  if (!d) return null;
  return {
    id: d.uid || d.id,
    url: d.url,
    state: d.state || d.readyState,
    target: d.target,
    created: d.created ?? d.createdAt,
    commitSha: d.meta?.githubCommitSha,
    commitMessage: d.meta?.githubCommitMessage
  };
}

export async function vercelGetLatestDeployment({ projectId, target = 'production' } = {}) {
  assertAllowedVercelProject(projectId);
  const body = await vercelFetch(`/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=${encodeURIComponent(target)}&limit=1`);
  return { projectId, target, deployment: summarizeDeployment((body.deployments || [])[0]) };
}

export async function vercelTriggerRedeploy({ projectId, name, deploymentId, target = 'production' }) {
  assertAllowedVercelProject(projectId);
  let sourceDeploymentId = deploymentId;
  let deploymentName = name;
  if (!sourceDeploymentId || !deploymentName) {
    const latest = await vercelGetLatestDeployment({ projectId, target });
    if (!latest.deployment) throw new Error('No existing deployment found on this project to redeploy from');
    sourceDeploymentId = sourceDeploymentId || latest.deployment.id;
    deploymentName = deploymentName || latest.deployment.url?.split('-').slice(0, -2).join('-') || 'redeploy';
  }
  const body = await vercelFetch('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: deploymentName,
      deploymentId: sourceDeploymentId,
      target
    })
  });
  return { projectId, deployment: summarizeDeployment(body) };
}

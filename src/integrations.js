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

async function githubApiFetch(path, options = {}) {
  requireEnv(GITHUB_TOKEN, 'GITHUB_TOKEN');
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status} ${body?.message || ''}`.trim());
  return body;
}

// Atomic multi-file commit via the git data API (blob -> tree -> commit -> ref update),
// instead of N sequential single-file PUTs. Works for new or existing paths uniformly,
// since the tree is built from the branch's current tree plus these blobs — no per-file
// sha lookup needed. One network round trip per file for the blob, plus 4 fixed calls.
export async function githubCommitFiles({ repository, files, message, branch = DEFAULT_GITHUB_BRANCH }) {
  requireEnv(GITHUB_TOKEN, 'GITHUB_TOKEN');
  assertAllowedRepo(repository);
  if (!Array.isArray(files) || !files.length) throw new Error('files must be a non-empty array of { path, content }');

  const ref = await githubApiFetch(`/repos/${repository}/git/ref/heads/${encodeURIComponent(branch)}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubApiFetch(`/repos/${repository}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const treeEntries = [];
  for (const file of files) {
    const blob = await githubApiFetch(`/repos/${repository}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: file.content, encoding: 'utf-8' })
    });
    treeEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await githubApiFetch(`/repos/${repository}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries })
  });

  const newCommit = await githubApiFetch(`/repos/${repository}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseCommitSha] })
  });

  await githubApiFetch(`/repos/${repository}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha })
  });

  return { repository, branch, commit_sha: newCommit.sha, files: files.map(f => f.path) };
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

const HF_TOKEN = process.env.HF_TOKEN;
const HF_ROUTER = 'https://router.huggingface.co/v1';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_GITHUB_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || 'main';

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

export async function hfModels(search = '') {
  const data = await hfFetch('/models');
  const models = (data.data || []).filter(model => {
    if (search && !model.id.toLowerCase().includes(search.toLowerCase())) return false;
    return (model.providers || []).some(provider => provider.status === 'live' && provider.is_free === true);
  });
  return models.slice(0, 30).map(model => ({
    id: model.id,
    free_providers: (model.providers || []).filter(p => p.status === 'live' && p.is_free === true).map(p => p.provider)
  }));
}

async function hfModelInfo(model) {
  return hfFetch(`/models/${encodeURIComponent(model)}`);
}

export async function hfChat({ model, prompt, system, max_tokens = 1024 }) {
  const info = await hfModelInfo(model);
  const freeProviders = (info.providers || []).filter(p => p.status === 'live' && p.is_free === true);
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

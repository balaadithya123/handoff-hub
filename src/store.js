import fs from 'node:fs/promises';
import path from 'node:path';

const localFile = userId => path.join('/tmp', `handoff-hub-state-${userId}.json`);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const MAX_RETRIES = 5;

const empty = () => ({ projects: {}, memories: [], events: [] });

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

async function readLocal(userId) {
  try { return JSON.parse(await fs.readFile(localFile(userId), 'utf8')); }
  catch { return empty(); }
}

async function writeLocal(userId, state) {
  const file = localFile(userId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, file);
}

async function readSupabase(userId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&select=state,version,updated_at`,
    { headers: supabaseHeaders() }
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  if (!rows[0]) return { state: empty(), version: null, updatedAt: null };
  return {
    state: rows[0].state ?? empty(),
    version: Number(rows[0].version ?? 0),
    updatedAt: rows[0].updated_at ?? null
  };
}

async function insertSupabase(userId, state) {
  const updatedAt = new Date().toISOString();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/handoff_state`, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    }),
    body: JSON.stringify({ id: userId, user_id: userId, state, version: 0, updated_at: updatedAt })
  });
  if (r.ok) return true;
  if (r.status === 409) return false;
  throw new Error(`Supabase insert failed: ${r.status}`);
}

async function writeSupabase(userId, state, expectedVersion) {
  const updatedAt = new Date().toISOString();
  if (expectedVersion === null) return insertSupabase(userId, state);

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&version=eq.${encodeURIComponent(expectedVersion)}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }),
      body: JSON.stringify({ state, version: expectedVersion + 1, updated_at: updatedAt })
    }
  );
  if (!r.ok) throw new Error(`Supabase write failed: ${r.status}`);
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Warm-instance snapshot cache. The whole account state is one JSON document, so every read or write moves
// all of it. We keep the last state this instance saw together with its version number:
//  - reads ask Supabase only for the version (a few bytes) and reuse the cached state when it is unchanged;
//  - writes try the cached version first, skipping the read. The version check in the PATCH still rejects a
//    write if another instance changed the state, in which case we drop the cache and re-read.
const snapshots = new Map();
const MAX_CACHED_USERS = 20;
export const storeStats = { version_probes: 0, cache_hits: 0, cache_misses: 0, optimistic_writes: 0, conflicts: 0 };

function remember(userId, state, version) {
  if (snapshots.size >= MAX_CACHED_USERS && !snapshots.has(userId)) snapshots.delete(snapshots.keys().next().value);
  snapshots.set(userId, { state: structuredClone(state), version });
}

async function readVersion(userId) {
  storeStats.version_probes += 1;
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&select=version`,
    { headers: supabaseHeaders() }
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  return rows[0] ? Number(rows[0].version ?? 0) : null;
}

async function readCached(userId) {
  const cached = snapshots.get(userId);
  if (cached) {
    const version = await readVersion(userId);
    if (version !== null && version === cached.version) {
      storeStats.cache_hits += 1;
      return structuredClone(cached.state);
    }
  }
  storeStats.cache_misses += 1;
  const snap = await readSupabase(userId);
  if (snap.version !== null) remember(userId, snap.state, snap.version);
  return snap.state;
}

async function mutateSupabase(userId, fn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    // First attempt may reuse the cached snapshot (no read). Retries always read fresh.
    const cached = attempt === 0 ? snapshots.get(userId) : null;
    const snapshot = cached ? { state: structuredClone(cached.state), version: cached.version } : await readSupabase(userId);
    if (cached) storeStats.optimistic_writes += 1;

    if (snapshot.version === null) {
      const state = empty();
      const result = await fn(state);
      const inserted = await writeSupabase(userId, state, null);
      if (inserted) { remember(userId, state, 0); return result; }
      await sleep(10 + Math.floor(Math.random() * 40));
      continue;
    }

    const result = await fn(snapshot.state);
    const updated = await writeSupabase(userId, snapshot.state, snapshot.version);
    if (updated) { remember(userId, snapshot.state, snapshot.version + 1); return result; }

    storeStats.conflicts += 1;
    snapshots.delete(userId);
    await sleep(10 + Math.floor(Math.random() * 40));
  }
  throw new Error('Concurrent state update detected after 5 retries');
}

async function readState(userId) {
  if (!useSupabase) return readLocal(userId);
  return readCached(userId);
}

const queues = new Map();
export function mutate(userId, fn) {
  const prior = queues.get(userId) ?? Promise.resolve();
  const next = prior.then(async () => {
    if (!useSupabase) {
      const state = await readLocal(userId);
      const result = await fn(state);
      await writeLocal(userId, state);
      return result;
    }
    return mutateSupabase(userId, fn);
  }).finally(() => {
    if (queues.get(userId) === next) queues.delete(userId);
  });
  queues.set(userId, next);
  return next;
}

export const getState = async userId => readState(userId);

export function project(state, id) {
  if (!state.projects[id]) state.projects[id] = { id, memories: [], events: [], integrations: {}, created_at: new Date().toISOString() };
  return state.projects[id];
}

// The project the portal Overview and approvals read. Unset means the normal "default" pool (unchanged behaviour).
export function opsProject(state) {
  return state?.meta?.ops_project || 'default';
}

// Optional projects only: the normal "default" pool is never listed, and no projects means an empty list.
export function summarizeProjects(state) {
  const ops = opsProject(state);
  return Object.values(state.projects || {})
    .filter(p => p.id !== 'default')
    .map(p => ({
      id: p.id,
      name: p.name || p.id,
      description: p.description,
      counts: { memories: (p.memories || []).length, events: (p.events || []).length, tasks: (p.tasks || []).length },
      updated_at: p.updated_at || p.created_at || null,
      ...(p.id === ops ? { portal_project: true } : {})
    }));
}

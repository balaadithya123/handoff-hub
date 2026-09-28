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

async function mutateSupabase(userId, fn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const snapshot = await readSupabase(userId);

    if (snapshot.version === null) {
      const state = empty();
      const result = await fn(state);
      const inserted = await writeSupabase(userId, state, null);
      if (inserted) return result;
      await sleep(10 + Math.floor(Math.random() * 40));
      continue;
    }

    const result = await fn(snapshot.state);
    const updated = await writeSupabase(userId, snapshot.state, snapshot.version);
    if (updated) return result;

    await sleep(10 + Math.floor(Math.random() * 40));
  }
  throw new Error('Concurrent state update detected after 5 retries');
}

async function readState(userId) {
  if (!useSupabase) return readLocal(userId);
  return (await readSupabase(userId)).state;
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
  if (!state.projects[id]) state.projects[id] = { id, memories: [], events: [], integrations: {} };
  return state.projects[id];
}

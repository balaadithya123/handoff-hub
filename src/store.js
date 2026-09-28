import fs from 'node:fs/promises';
import path from 'node:path';

const localFile = userId => path.join('/tmp', `handoff-hub-state-${userId}.json`);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

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
    `${SUPABASE_URL}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&select=state,updated_at`,
    { headers: supabaseHeaders() }
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  if (!rows[0]) return { state: empty(), updatedAt: null };
  return { state: rows[0].state ?? empty(), updatedAt: rows[0].updated_at ?? null };
}

async function writeSupabase(userId, state, expectedUpdatedAt) {
  const updatedAt = new Date().toISOString();

  if (expectedUpdatedAt === null) {
    const insert = await fetch(`${SUPABASE_URL}/rest/v1/handoff_state?on_conflict=id`, {
      method: 'POST',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      }),
      body: JSON.stringify({ id: userId, user_id: userId, state, updated_at: updatedAt })
    });
    if (!insert.ok) throw new Error(`Supabase write failed: ${insert.status}`);

    // If another instance created the row first, retry through the
    // compare-and-swap path instead of silently overwriting its state.
    const verify = await readSupabase(userId);
    if (verify.updatedAt !== updatedAt) {
      throw new Error('Concurrent state update detected; retry the mutation');
    }
    return;
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/handoff_state?id=eq.${encodeURIComponent(userId)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      }),
      body: JSON.stringify({ state, updated_at: updatedAt })
    }
  );
  if (!r.ok) throw new Error(`Supabase write failed: ${r.status}`);

  const verify = await readSupabase(userId);
  if (verify.updatedAt !== updatedAt) {
    throw new Error('Concurrent state update detected; retry the mutation');
  }
}

async function readState(userId) {
  if (!useSupabase) return readLocal(userId);
  return (await readSupabase(userId)).state;
}

async function writeState(userId, state, expectedUpdatedAt = null) {
  if (!useSupabase) return writeLocal(userId, state);
  return writeSupabase(userId, state, expectedUpdatedAt);
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

    const snapshot = await readSupabase(userId);
    const result = await fn(snapshot.state);
    await writeState(userId, snapshot.state, snapshot.updatedAt);
    return result;
  });
  queues.set(userId, next);
  return next;
}

export const getState = async userId => readState(userId);

export function project(state, id) {
  if (!state.projects[id]) state.projects[id] = { id, memories: [], events: [], integrations: {} };
  return state.projects[id];
}

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
    `${SUPABASE_URL}/rest/v1/handoff_state?user_id=eq.${encodeURIComponent(userId)}&select=state`,
    { headers: supabaseHeaders() }
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  return rows[0]?.state ?? empty();
}

async function writeSupabase(userId, state) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/handoff_state?on_conflict=user_id`, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    }),
    body: JSON.stringify({ id: userId, user_id: userId, state, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(`Supabase write failed: ${r.status}`);
}

async function readState(userId) {
  return useSupabase ? readSupabase(userId) : readLocal(userId);
}

async function writeState(userId, state) {
  return useSupabase ? writeSupabase(userId, state) : writeLocal(userId, state);
}

const queues = new Map();
export function mutate(userId, fn) {
  const prior = queues.get(userId) ?? Promise.resolve();
  const next = prior.then(async () => {
    const state = await readState(userId);
    const result = await fn(state);
    await writeState(userId, state);
    return result;
  });
  queues.set(userId, next);
  return next;
}

export const getState = readState;

export function project(state, id) {
  if (!state.projects[id]) state.projects[id] = { id, memories: [], events: [], integrations: {} };
  return state.projects[id];
}

import fs from 'node:fs/promises';
import path from 'node:path';

// Local fallback store (used only when Supabase env vars are absent, e.g. local dev).
// NOTE: on Vercel this writes to /tmp, which is per-instance and NOT shared across
// concurrent function instances or cold starts — fine for local testing, not for
// production durability. That's what SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fix below.
const file = process.env.HANDOFF_STATE_FILE || path.join('/tmp', 'handoff-hub-state.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const ROW_ID = 'default';

const empty = () => ({ projects: {}, memories: [], events: [] });

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

async function readLocal() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return empty(); }
}

async function writeLocal(state) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, file);
}

async function readSupabase() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/handoff_state?id=eq.${ROW_ID}&select=state`,
    { headers: supabaseHeaders() }
  );
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  return rows[0]?.state ?? empty();
}

async function writeSupabase(state) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/handoff_state?on_conflict=id`, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    }),
    body: JSON.stringify({ id: ROW_ID, state })
  });
  if (!r.ok) throw new Error(`Supabase write failed: ${r.status}`);
}

async function readState() {
  return useSupabase ? readSupabase() : readLocal();
}

async function writeState(state) {
  return useSupabase ? writeSupabase(state) : writeLocal(state);
}

// Serializes writes within a single warm instance. mutate() always re-reads the
// latest persisted state first (from Supabase when configured) before applying fn,
// so a partial update never clobbers fields another agent or a different instance
// already saved. Across *different* concurrent instances this is still read-modify-
// write, not a transaction — fine for one or two agents talking turn by turn, not
// yet safe for truly simultaneous writers. A future step would move this to a
// Postgres function (e.g. Supabase RPC) that does the merge server-side.
let queue = Promise.resolve();
export function mutate(fn) {
  queue = queue.then(async () => {
    const state = await readState();
    const result = await fn(state);
    await writeState(state);
    return result;
  });
  return queue;
}

export const getState = readState;

export function project(state, id) {
  if (!state.projects[id]) state.projects[id] = { id, memories: [], events: [], integrations: {} };
  return state.projects[id];
}

import fs from 'node:fs/promises';
import path from 'node:path';

const file = process.env.HANDOFF_STATE_FILE || path.join('/tmp', 'handoff-hub-state.json');
let queue = Promise.resolve();

const empty = () => ({ projects: {}, memories: [], events: [] });

async function readState() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return empty(); }
}

async function writeState(state) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2));
  await fs.rename(tmp, file);
}

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

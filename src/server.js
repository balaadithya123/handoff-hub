import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { project, getState, mutate } from './store.js';
import { z } from 'zod';

export function createServer() {
  const server = new McpServer({ name: 'handoff-hub', version: '0.3.0' });
  const text = value => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

  server.tool('get_project_state', { project_id: z.string().min(1) }, async ({ project_id }) => {
    const state = await getState();
    return text(project(state, project_id));
  });

  server.tool('update_project_state', {
    project_id: z.string().min(1),
    summary: z.string().min(1),
    decisions: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
    agent: z.string().min(1).optional()
  }, async input => text(await mutate(state => {
    const p = project(state, input.project_id);
    p.summary = input.summary;
    p.decisions = input.decisions ?? p.decisions ?? [];
    p.blockers = input.blockers ?? p.blockers ?? [];
    p.updated_at = new Date().toISOString();
    p.last_agent = input.agent ?? p.last_agent ?? 'unknown';
    p.events.unshift({ type: 'state_update', agent: p.last_agent, summary: input.summary, at: p.updated_at });
    p.events = p.events.slice(0, 100);
    return p;
  })));

  server.tool('remember', {
    project_id: z.string().min(1),
    memory: z.string().min(1),
    source: z.string().optional(),
    tags: z.array(z.string()).optional()
  }, async input => text(await mutate(state => {
    const p = project(state, input.project_id);
    const item = { id: crypto.randomUUID(), memory: input.memory, source: input.source ?? 'unknown', tags: input.tags ?? [], at: new Date().toISOString() };
    p.memories.unshift(item); p.memories = p.memories.slice(0, 500); return item;
  })));

  server.tool('recall', { project_id: z.string().min(1), query: z.string().optional(), limit: z.number().int().min(1).max(50).optional() }, async ({ project_id, query = '', limit = 10 }) => {
    const state = await getState(); const p = project(state, project_id);
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const ranked = p.memories.map(m => ({ m, score: words.reduce((n,w) => n + (m.memory.toLowerCase().includes(w) ? 1 : 0), 0) }))
      .sort((a,b) => b.score - a.score).slice(0, limit).map(x => x.m);
    return text(ranked);
  });

  server.tool('record_event', {
    project_id: z.string().min(1), agent: z.string().min(1), action: z.string().min(1), details: z.string().optional()
  }, async input => text(await mutate(state => {
    const p = project(state, input.project_id);
    const event = { id: crypto.randomUUID(), ...input, at: new Date().toISOString() };
    p.events.unshift(event); p.events = p.events.slice(0, 100); return event;
  })));

  server.tool('recent_events', { project_id: z.string().min(1), limit: z.number().int().min(1).max(100).optional() }, async ({ project_id, limit = 20 }) => {
    const state = await getState(); return text(project(state, project_id).events.slice(0, limit));
  });

  server.tool('set_integration', {
    project_id: z.string().min(1), name: z.string().min(1), type: z.string().min(1), capabilities: z.array(z.string()).optional()
  }, async input => text(await mutate(state => {
    const p = project(state, input.project_id);
    p.integrations[input.name] = { type: input.type, capabilities: input.capabilities ?? [], updated_at: new Date().toISOString() };
    return p.integrations[input.name];
  })));

  server.tool('list_projects', {}, async () => text(Object.values((await getState()).projects)));
  return server;
}

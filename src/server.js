import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { project, getState, mutate } from './store.js';
import { z } from 'zod';

const projectId = z.string().min(1).optional().describe('Optional stable project identifier. If omitted, Handoff Hub uses the default shared project.');

export function createServer() {
  const server = new McpServer({
    name: 'handoff-hub',
    version: '0.5.0'
  });

  const text = value => ({
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }]
  });

  server.tool(
    'remember',
    'Handoff Hub shared memory. When the user says remember/save/store something in Handoff Hub, use this tool instead of relying on ChatGPT native memory. Save project context so it can be retrieved from another chat or another AI agent.',
    {
      project_id: projectId,
      memory: z.string().min(1).describe('The information that should be remembered.'),
      source: z.string().optional().describe('AI or application that supplied the memory, such as ChatGPT, Claude, Codex, or Gemini.'),
      tags: z.array(z.string()).optional().describe('Optional searchable tags.')
    },
    async input => text(await mutate(state => {
      const p = project(state, input.project_id ?? 'default');
      const item = {
        id: crypto.randomUUID(),
        project_id: input.project_id ?? 'default',
        memory: input.memory,
        source: input.source ?? 'unknown',
        tags: input.tags ?? [],
        at: new Date().toISOString()
      };
      p.memories.unshift(item);
      p.memories = p.memories.slice(0, 500);
      return item;
    }))
  );

  server.tool(
    'recall',
    'Retrieve information from Handoff Hub shared memory. Use this when the user asks what Handoff Hub remembers, especially when context may have been created by another chat or AI. Do not substitute ChatGPT native memory for this tool.',
    {
      project_id: projectId,
      query: z.string().optional().describe('Words or a short description of the context to retrieve.'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum number of memories to return.')
    },
    async ({ project_id, query = '', limit = 10 }) => {
      const state = await getState();
      const p = project(state, project_id ?? 'default');
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      const ranked = p.memories
        .map(m => ({ m, score: words.reduce((n, w) => n + (m.memory.toLowerCase().includes(w) ? 1 : 0), 0) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.m);
      return text(ranked);
    }
  );

  server.tool(
    'record_event',
    'Record an action completed by an AI agent in Handoff Hub so another agent can see what happened without manual explanation.',
    {
      project_id: projectId,
      agent: z.string().min(1).describe('Agent name, for example ChatGPT, Claude, Codex, or Gemini.'),
      action: z.string().min(1).describe('Short description of the completed action.'),
      details: z.string().optional().describe('Optional additional details.')
    },
    async input => text(await mutate(state => {
      const p = project(state, input.project_id ?? 'default');
      const event = { id: crypto.randomUUID(), project_id: input.project_id ?? 'default', agent: input.agent, action: input.action, details: input.details, at: new Date().toISOString() };
      p.events.unshift(event);
      p.events = p.events.slice(0, 100);
      return event;
    }))
  );

  server.tool(
    'recent_events',
    'Read recent cross-agent activity from Handoff Hub. Use this to understand what another AI has already done.',
    {
      project_id: projectId,
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of events to return.')
    },
    async ({ project_id, limit = 20 }) => {
      const state = await getState();
      return text(project(state, project_id ?? 'default').events.slice(0, limit));
    }
  );

  server.tool(
    'get_project_state',
    'Read the current shared Handoff Hub project state, including summary, decisions, blockers, recent events, memories, and integrations.',
    { project_id: projectId },
    async ({ project_id }) => text(project(await getState(), project_id ?? 'default'))
  );

  server.tool(
    'update_project_state',
    'Update shared Handoff Hub project status so every connected AI can continue from the same state.',
    {
      project_id: projectId,
      summary: z.string().min(1).describe('Current project summary.'),
      decisions: z.array(z.string()).optional().describe('Important decisions already made.'),
      blockers: z.array(z.string()).optional().describe('Current blockers.'),
      agent: z.string().min(1).optional().describe('AI agent making the update.')
    },
    async input => text(await mutate(state => {
      const p = project(state, input.project_id ?? 'default');
      p.summary = input.summary;
      p.decisions = input.decisions ?? p.decisions ?? [];
      p.blockers = input.blockers ?? p.blockers ?? [];
      p.updated_at = new Date().toISOString();
      p.last_agent = input.agent ?? p.last_agent ?? 'unknown';
      p.events.unshift({ type: 'state_update', agent: p.last_agent, summary: input.summary, at: p.updated_at });
      p.events = p.events.slice(0, 100);
      return p;
    }))
  );

  server.tool(
    'set_integration',
    'Register an integration available to a Handoff Hub project, such as GitHub, Supabase, or Vercel. This records capabilities only; it does not grant credentials.',
    {
      project_id: projectId,
      name: z.string().min(1).describe('Integration name.'),
      type: z.string().min(1).describe('Integration type.'),
      capabilities: z.array(z.string()).optional().describe('Capabilities provided by the integration.')
    },
    async input => text(await mutate(state => {
      const p = project(state, input.project_id ?? 'default');
      p.integrations[input.name] = {
        type: input.type,
        capabilities: input.capabilities ?? [],
        updated_at: new Date().toISOString()
      };
      return p.integrations[input.name];
    }))
  );

  server.tool(
    'list_projects',
    'List projects known to this Handoff Hub instance.',
    {},
    async () => text(Object.values((await getState()).projects))
  );

  return server;
}

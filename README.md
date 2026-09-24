# Handoff Hub

Cloud-first MCP hub for cross-AI project memory, handoffs, events, and integration metadata.

## Architecture

AI clients (Claude, ChatGPT, Codex, Gemini, etc.) connect to one MCP endpoint. The hub keeps project context independent of the AI that produced it.

Current MCP tools:
- `get_project_state`
- `update_project_state`
- `remember`
- `recall`
- `record_event`
- `recent_events`
- `set_integration`
- `list_projects`

## Deployment

Vercel serves `/mcp` through `api/mcp.js`.

Important: the current file store is a development fallback. Vercel's `/tmp` filesystem is ephemeral. Before production use, replace the store with Supabase/Postgres so memory survives cold starts and multiple instances.

## Next stage

1. Supabase/Postgres persistent store + pgvector.
2. OAuth/credential vault for integrations.
3. GitHub, Supabase and Vercel action adapters.
4. Model gateway with provider-independent AI support.
5. Browser extension for explicit conversation/project capture.

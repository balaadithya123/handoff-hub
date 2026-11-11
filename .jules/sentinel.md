## 2026-10-16 - Information Disclosure in MCP Error Responses
**Vulnerability:** Raw exception messages (`error?.message`) were returned in JSON responses on HTTP 500/503 errors in `api/mcp.js`.
**Learning:** Returning unhandled exception messages in API responses can leak internal module paths, environment configuration details, or stack trace information to unauthenticated external clients.
**Prevention:** Always log internal exception details server-side via `console.error` and return generic error messages in HTTP 500/503 response payloads.

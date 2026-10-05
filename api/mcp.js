const MCP_VERSION = '0.17.0';

function publicBase() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return null;
}

function protectedResourceMetadataUrl(base) {
  return `${base}/.well-known/oauth-protected-resource/api/mcp`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID, MCP-Protocol-Version');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, MCP-Protocol-Version, WWW-Authenticate');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    const info = { name: 'handoff-hub', version: MCP_VERSION, status: 'ok' };
    if (!/[?&]deep=1(?:&|$)/.test(req.url || '')) return res.status(200).json(info);
    // Deep probe: actually load the server modules and register every tool, so a broken import shows up here instead of on the first real request.
    try {
      const { createServer } = await import('../src/server.js');
      await import('../src/auth.js');
      const tools = Object.keys(createServer('00000000-0000-0000-0000-000000000000')._registeredTools || {}).length;
      return res.status(200).json({ ...info, deep: true, tools });
    } catch (error) {
      console.error('MCP deep health failed:', error);
      return res.status(503).json({ ...info, status: 'degraded', deep: true, error: error?.message || String(error) });
    }
  }
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    const mcpModule = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const serverModule = await import('../src/server.js');
    const authModule = await import('../src/auth.js');
    const StreamableHTTPServerTransport = mcpModule.StreamableHTTPServerTransport;
    const createServer = serverModule.createServer;
    const authenticate = authModule.authenticate;

    const userId = await authenticate(req);
    if (!userId) {
      const base = publicBase();
      if (base) res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${protectedResourceMetadataUrl(base)}"`);
      return res.status(401).json({ error: 'Authentication required. Connect through OAuth, or send a Handoff Hub API key as Authorization: Bearer <api_key>.' });
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createServer(userId);
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request failed:', error);
    if (!res.headersSent) res.status(500).json({ error: 'MCP request failed', detail: error?.message || String(error) });
  }
}

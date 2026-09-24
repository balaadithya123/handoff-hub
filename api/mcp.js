import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../src/server.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ name: 'handoff-hub', status: 'ok' });
  if (!['POST','DELETE'].includes(req.method)) return res.status(405).end();
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
}

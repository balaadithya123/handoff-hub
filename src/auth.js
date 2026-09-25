import crypto from 'node:crypto';

// This is the actual isolation boundary for the whole product: every request
// to /api/mcp must resolve to exactly one user_id, and every read/write in
// store.js is scoped to that user_id.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function generateApiKey() {
  return `hh_${crypto.randomBytes(24).toString('hex')}`;
}

function queryTokenFromRequest(req) {
  // Vercel normally exposes query parameters through req.query, but some MCP
  // clients/proxies preserve the raw URL more reliably than the parsed query.
  const parsed = new URL(req.url || '/', `https://${req.headers?.host || 'localhost'}`);
  const token = parsed.searchParams.get('token');
  return token?.trim() || null;
}

// Accept Bearer, API-key style headers, or a query token. The query token is
// needed for custom MCP connector forms that only accept a server URL.
export async function authenticate(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-mcp-api-key'] || null;
  const parsedQueryToken = queryTokenFromRequest(req);
  const legacyQueryToken = typeof req.query?.token === 'string' ? req.query.token.trim() : null;
  const token = bearerToken || apiKeyHeader || parsedQueryToken || legacyQueryToken;
  if (!token) return null;

  const keyHash = hashKey(token);
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/users?key_hash=eq.${encodeURIComponent(keyHash)}&select=id`,
    { headers: headers() }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0]?.id ?? null;
}

export async function createUser() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase authentication is not configured');
  }

  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const id = crypto.randomUUID();

  const r = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ id, key_hash: keyHash, created_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(`Failed to create user: ${r.status}`);

  return { id, apiKey: rawKey };
}

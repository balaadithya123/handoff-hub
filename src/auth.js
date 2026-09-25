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

// Accept either a Bearer header or a query token. The latter is needed for
// clients whose custom MCP connector form only accepts a server URL.
export async function authenticate(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const authHeader = req.headers['authorization'] || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;
  const token = headerToken || queryToken;
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

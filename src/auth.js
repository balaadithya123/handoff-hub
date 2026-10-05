import crypto from 'node:crypto';
import { userIdFromAccessToken } from './oauth-store.js';

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

export async function userIdFromApiKey(token) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !token) return null;
  const keyHash = hashKey(token);
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/users?key_hash=eq.${encodeURIComponent(keyHash)}&select=id`,
    { headers: headers() }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0]?.id ?? null;
}

// OAuth access tokens and API keys are accepted only through explicit auth headers.
// Legacy ?token= URL authentication remains disabled.
export async function authenticate(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-mcp-api-key'] || null;
  const token = bearerToken || apiKeyHeader;
  if (!token) return null;

  if (token.startsWith('hho_')) return userIdFromAccessToken(token);
  return userIdFromApiKey(token);
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

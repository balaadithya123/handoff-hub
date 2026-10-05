import crypto from "node:crypto";

export type Provider = "github" | "canva" | "vercel";

const configs: Record<Provider, { client: string; secret: string; auth: string; token: string; scopes: string }> = {
  github: { client: "GITHUB_CLIENT_ID", secret: "GITHUB_CLIENT_SECRET", auth: "https://github.com/login/oauth/authorize", token: "https://github.com/login/oauth/access_token", scopes: "read:user user:email repo" },
  canva: { client: "CANVA_CLIENT_ID", secret: "CANVA_CLIENT_SECRET", auth: "https://www.canva.com/api/oauth/authorize", token: "https://api.canva.com/rest/v1/oauth/token", scopes: "design:meta:read design:content:read profile:read" },
  vercel: { client: "VERCEL_CLIENT_ID", secret: "VERCEL_CLIENT_SECRET", auth: "https://vercel.com/oauth/authorize", token: "https://api.vercel.com/v2/oauth/access_token", scopes: "openid email profile offline_access" },
};

export function providerConfig(provider: string) { return provider in configs ? configs[provider as Provider] : null; }
export function randomUrlSafe(bytes = 32) { return crypto.randomBytes(bytes).toString("base64url"); }
export function pkceChallenge(verifier: string) { return crypto.createHash("sha256").update(verifier).digest("base64url"); }

function key() {
  const secret = process.env.PORTAL_ENC_KEY;
  if (!secret) throw new Error("Portal encryption is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}
export function encrypt(value: string) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(x => x.toString("base64url")).join(".");
}

function supabase() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !anon) throw new Error("Supabase is not configured");
  return { base, headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" } };
}

async function rpc(name: string, body: Record<string, unknown>) {
  const { base, headers } = supabase();
  const r = await fetch(`${base}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
  if (!r.ok) throw new Error(`Supabase RPC failed: ${name}`);
  return r.json();
}

export async function accountIdByToken(sessionToken: string) {
  return (await rpc("portal_account_id", { p_token: sessionToken })) as string | null;
}

export async function connectionStatus(sessionToken: string) {
  return (await rpc("portal_connections_status", { p_token: sessionToken })) as Array<{provider: Provider; provider_account_name: string | null; scope: string | null; updated_at: string}>;
}

export async function saveConnection(sessionToken: string, provider: Provider, token: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string }, providerAccountId?: string, providerAccountName?: string) {
  const ok = await rpc("portal_connection_upsert", {
    p_token: sessionToken, p_provider: provider, p_access_token: encrypt(token.access_token),
    p_refresh_token: token.refresh_token ? encrypt(token.refresh_token) : null,
    p_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    p_provider_account_id: providerAccountId ?? null, p_provider_account_name: providerAccountName ?? null, p_scope: token.scope ?? null,
  });
  if (!ok) throw new Error("Could not save provider connection");
}

export async function deleteConnection(sessionToken: string, provider: Provider) {
  const ok = await rpc("portal_connection_delete", { p_token: sessionToken, p_provider: provider });
  if (!ok) throw new Error("Could not disconnect provider");
}

export async function exchangeCode(provider: Provider, code: string, redirectUri: string, verifier: string) {
  const cfg = configs[provider]; const clientId = process.env[cfg.client]; const clientSecret = process.env[cfg.secret];
  if (!clientId || !clientSecret) throw new Error(`${provider.toUpperCase()} OAuth is not configured yet`);
  const body = new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, code_verifier: verifier });
  const r = await fetch(cfg.token, { method: "POST", headers: { Accept: "application/json" }, body }); const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error(data.error_description || data.error || "OAuth token exchange failed");
  return data as {access_token:string; refresh_token?:string; expires_in?:number; scope?:string};
}
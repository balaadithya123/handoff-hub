import crypto from "node:crypto";

export type Provider = "github" | "canva" | "vercel";

const configs: Record<Provider, { client: string; secret: string; auth: string; token: string; scopes: string }> = {
  github: {
    client: "GITHUB_CLIENT_ID",
    secret: "GITHUB_CLIENT_SECRET",
    auth: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scopes: "read:user user:email repo",
  },
  canva: {
    client: "CANVA_CLIENT_ID",
    secret: "CANVA_CLIENT_SECRET",
    auth: "https://www.canva.com/api/oauth/authorize",
    token: "https://api.canva.com/rest/v1/oauth/token",
    scopes: "design:meta:read design:content:read profile:read",
  },
  vercel: {
    client: "VERCEL_CLIENT_ID",
    secret: "VERCEL_CLIENT_SECRET",
    auth: "https://vercel.com/oauth/authorize",
    token: "https://api.vercel.com/v2/oauth/access_token",
    scopes: "openid email profile offline_access",
  },
};

export function providerConfig(provider: string) {
  if (!(provider in configs)) return null;
  return configs[provider as Provider];
}

export function randomUrlSafe(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function key() {
  const secret = process.env.PORTAL_ENC_KEY;
  if (!secret) throw new Error("PORTAL_ENC_KEY is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((x) => x.toString("base64url")).join(".");
}

export function decrypt(value: string) {
  const [ivRaw, tagRaw, dataRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("Invalid encrypted token");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function accountIdByEmail(email: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Supabase is not configured");
  const r = await fetch(`${base}/rest/v1/portal_accounts?select=id&email=eq.${encodeURIComponent(email)}&limit=1`, {
    headers: supabaseHeaders(), cache: "no-store",
  });
  if (!r.ok) throw new Error("Could not load portal account");
  const rows = await r.json();
  return rows[0]?.id as string | undefined;
}

export async function saveConnection(accountId: string, provider: Provider, token: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string }, providerAccountId?: string, providerAccountName?: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const body = {
    account_id: accountId,
    provider,
    access_token: encrypt(token.access_token),
    refresh_token: token.refresh_token ? encrypt(token.refresh_token) : null,
    expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    provider_account_id: providerAccountId ?? null,
    provider_account_name: providerAccountName ?? null,
    scope: token.scope ?? null,
    updated_at: new Date().toISOString(),
  };
  const r = await fetch(`${base}/rest/v1/portal_connections?on_conflict=account_id,provider`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body), cache: "no-store",
  });
  if (!r.ok) throw new Error("Could not save provider connection");
}

export async function connectionStatus(accountId: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const r = await fetch(`${base}/rest/v1/portal_connections?select=provider,provider_account_name,scope,updated_at&account_id=eq.${encodeURIComponent(accountId)}`, {
    headers: supabaseHeaders(), cache: "no-store",
  });
  if (!r.ok) throw new Error("Could not load connections");
  return r.json() as Promise<Array<{provider: Provider; provider_account_name: string | null; scope: string | null; updated_at: string}>>;
}

export async function deleteConnection(accountId: string, provider: Provider) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const r = await fetch(`${base}/rest/v1/portal_connections?account_id=eq.${encodeURIComponent(accountId)}&provider=eq.${encodeURIComponent(provider)}`, {
    method: "DELETE", headers: supabaseHeaders(), cache: "no-store",
  });
  if (!r.ok) throw new Error("Could not disconnect provider");
}

export async function exchangeCode(provider: Provider, code: string, redirectUri: string, verifier: string) {
  const cfg = configs[provider];
  const clientId = process.env[cfg.client];
  const clientSecret = process.env[cfg.secret];
  if (!clientId || !clientSecret) throw new Error(`${provider.toUpperCase()} OAuth is not configured yet`);
  const body = new URLSearchParams({
    grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret,
    code, redirect_uri: redirectUri, code_verifier: verifier,
  });
  const r = await fetch(cfg.token, { method: "POST", headers: { Accept: "application/json" }, body });
  const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error(data.error_description || data.error || "OAuth token exchange failed");
  return data as {access_token:string; refresh_token?:string; expires_in?:number; scope?:string};
}

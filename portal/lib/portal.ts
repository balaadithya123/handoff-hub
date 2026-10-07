export const SESSION_COOKIE = "portal_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type SessionUser = { email: string };

/** Calls a Postgres function in Supabase via PostgREST using the publishable key. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  const r = await fetch(url + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) throw new Error("RPC " + fn + " failed: " + r.status);
  return (text ? JSON.parse(text) : null) as T;
}

export async function sessionUser(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const d = await rpc<{ ok?: boolean; email?: string } | null>("portal_session", { p_token: token });
    return d && d.ok && d.email ? { email: d.email } : null;
  } catch {
    return null;
  }
}

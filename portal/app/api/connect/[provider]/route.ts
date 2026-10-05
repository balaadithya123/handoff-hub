import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionUser } from "../../../../lib/portal";
import { exchangeCode, pkceChallenge, providerConfig, randomUrlSafe, saveConnection } from "../../../../lib/connections";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const cfg = providerConfig(provider);
  if (!cfg) return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });

  const user = await sessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.redirect(new URL("/login?next=/", req.url));
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.redirect(new URL("/login?next=/", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const jar = await cookies();

  if (code) {
    const expectedState = jar.get("oauth_state")?.value;
    const verifier = jar.get("oauth_verifier")?.value;
    const expectedProvider = jar.get("oauth_provider")?.value;
    if (!state || !expectedState || state !== expectedState || expectedProvider !== provider || !verifier) {
      return NextResponse.redirect(new URL("/?connection_error=invalid_oauth_state", req.url));
    }
    try {
      const token = await exchangeCode(provider as "github" | "canva" | "vercel", code, url.origin + `/api/connect/${provider}`, verifier);
      let providerId: string | undefined;
      let providerName: string | undefined;
      if (provider === "github") {
        const p = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json" } });
        if (p.ok) { const u = await p.json(); providerId = String(u.id); providerName = u.login; }
      } else if (provider === "vercel") {
        const p = await fetch("https://api.vercel.com/login/oauth/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
        if (p.ok) { const u = await p.json(); providerId = u.sub; providerName = u.preferred_username || u.name || u.email; }
      }
      await saveConnection(sessionToken, provider as "github" | "canva" | "vercel", token, providerId, providerName);
      for (const name of ["oauth_state","oauth_verifier","oauth_provider"]) jar.set(name, "", { maxAge: 0, path: "/" });
      return NextResponse.redirect(new URL("/?connected=" + provider, req.url));
    } catch (e) {
      return NextResponse.redirect(new URL("/?connection_error=" + encodeURIComponent(e instanceof Error ? e.message : "oauth_failed"), req.url));
    }
  }

  if (error) return NextResponse.redirect(new URL("/?connection_error=" + encodeURIComponent(error), req.url));

  const clientId = process.env[cfg.client];
  if (!clientId) return NextResponse.redirect(new URL("/?connection_error=" + provider + "_oauth_not_configured", req.url));
  const stateValue = randomUrlSafe(32);
  const verifier = randomUrlSafe(48);
  const challenge = pkceChallenge(verifier);
  jar.set("oauth_state", stateValue, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  jar.set("oauth_verifier", verifier, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  jar.set("oauth_provider", provider, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  const redirectUri = url.origin + `/api/connect/${provider}`;
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", state: stateValue, code_challenge: challenge, code_challenge_method: "S256", scope: cfg.scopes });
  return NextResponse.redirect(`${cfg.auth}?${q.toString()}`);
}

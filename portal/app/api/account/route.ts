import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, rpc, sessionUser } from "../../../lib/portal";

export const dynamic = "force-dynamic";

type AuthResult = { ok?: boolean; error?: string; email?: string; token?: string } | null;

export async function GET(req: NextRequest) {
  const user = await sessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  let body: { action?: string; email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const action = body.action === "signup" ? "signup" : "login";
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  try {
    const d = await rpc<AuthResult>(action === "signup" ? "portal_signup" : "portal_login", {
      p_email: email,
      p_password: password,
    });
    if (!d || !d.ok || !d.token) {
      return NextResponse.json({ error: d?.error || "Could not sign in." }, { status: 401 });
    }
    const res = NextResponse.json({ user: { email: d.email } });
    res.cookies.set(SESSION_COOKIE, d.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "The account service is unavailable. Try again shortly." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await rpc("portal_logout", { p_token: token });
    } catch {
      /* cookie is cleared regardless */
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

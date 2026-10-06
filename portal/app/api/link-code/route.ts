import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    const d = await rpc<{ ok?: boolean; code?: string; error?: string } | null>("portal_link_code", { p_token: token });
    if (!d || !d.ok || !d.code) return NextResponse.json({ error: d?.error || "Could not create a link code." }, { status: 400 });
    return NextResponse.json({ code: d.code, expires_in_minutes: 10 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

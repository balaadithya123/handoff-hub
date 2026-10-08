import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hub = typeof body?.hub === "string" ? body.hub : "";
  const id = typeof body?.id === "string" ? body.id : "";
  const decision = body?.decision;
  if (!/^[0-9a-f-]{36}$/i.test(hub)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) return NextResponse.json({ error: "Invalid approval." }, { status: 400 });
  if (decision !== "approve" && decision !== "deny") return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  try {
    const d = await rpc<{ ok?: boolean; error?: string } | null>("portal_decide_approval", { p_token: token, p_hub_user: hub, p_id: id, p_decision: decision });
    return d?.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: d?.error || "Could not save the decision." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

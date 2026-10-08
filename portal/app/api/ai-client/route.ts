import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

type R = { ok?: boolean; error?: string; nickname?: string | null } | null;

/** Per-AI-app controls: rename (nickname) or unlink one AI app of a Hub account. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hub = typeof body?.hub === "string" ? body.hub : "";
  const client = typeof body?.client === "string" ? body.client : "";
  const action = body?.action;
  if (!/^[0-9a-f-]{36}$/i.test(hub)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(client)) return NextResponse.json({ error: "Invalid AI app." }, { status: 400 });
  try {
    if (action === "rename") {
      const nickname = typeof body?.nickname === "string" ? body.nickname : null;
      const d = await rpc<R>("portal_client_rename", { p_token: token, p_hub_user: hub, p_client: client, p_nickname: nickname });
      return d?.ok ? NextResponse.json({ ok: true, nickname: d.nickname ?? null }) : NextResponse.json({ error: d?.error || "Could not save the name." }, { status: 400 });
    }
    if (action === "unlink") {
      const d = await rpc<R>("portal_client_unlink", { p_token: token, p_hub_user: hub, p_client: client });
      return d?.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: d?.error || "Could not unlink." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

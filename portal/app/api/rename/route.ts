import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  if (body?.nickname !== null && typeof body?.nickname !== "string") return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  const nickname = typeof body.nickname === "string" ? body.nickname.slice(0, 200) : null;
  try {
    const d = await rpc<{ ok?: boolean; nickname?: string | null; error?: string } | null>("portal_rename", { p_token: token, p_hub_user: id, p_nickname: nickname });
    return d?.ok ? NextResponse.json({ ok: true, nickname: d.nickname ?? null }) : NextResponse.json({ error: d?.error || "Could not save the name." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

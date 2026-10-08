import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const kind = body?.kind === "github" || body?.kind === "vercel" ? body.kind : "";
  const action = body?.action === "add" || body?.action === "remove" ? body.action : "";
  const value = typeof body?.value === "string" ? body.value.slice(0, 200) : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !kind || !action) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const d = await rpc<{ ok?: boolean; list?: string[]; error?: string } | null>("portal_allowlist_edit", { p_token: token, p_hub_user: id, p_kind: kind, p_value: value, p_action: action });
    return d?.ok ? NextResponse.json({ ok: true, list: d.list ?? [] }) : NextResponse.json({ error: d?.error || "Could not update the allowlist." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

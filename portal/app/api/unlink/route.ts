import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  try {
    const d = await rpc<{ ok?: boolean; error?: string } | null>("portal_unlink", { p_token: token, p_hub_user: id });
    return d?.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: d?.error || "Could not unlink." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, rpc } from "../../../lib/portal";

export const dynamic = "force-dynamic";

type Res = { ok?: boolean; error?: string; id?: string; ops_project?: string } | null;

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hub = typeof body?.hub_user === "string" ? body.hub_user : "";
  if (!/^[0-9a-f-]{36}$/i.test(hub)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  const action = body?.action;
  try {
    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.slice(0, 200) : "";
      const description = typeof body.description === "string" ? body.description.slice(0, 600) : "";
      const d = await rpc<Res>("portal_project_create", { p_token: token, p_hub_user: hub, p_name: name, p_description: description });
      return d?.ok ? NextResponse.json({ ok: true, id: d.id ?? null }) : NextResponse.json({ error: d?.error || "Could not create the project." }, { status: 400 });
    }
    if (action === "set_portal") {
      const project = typeof body.project === "string" ? body.project.slice(0, 80) : "";
      if (!project) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
      const d = await rpc<Res>("portal_project_set_portal", { p_token: token, p_hub_user: hub, p_project: project });
      return d?.ok ? NextResponse.json({ ok: true, ops_project: d.ops_project ?? null }) : NextResponse.json({ error: d?.error || "Could not switch the project." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Service unavailable. Try again shortly." }, { status: 503 });
  }
}

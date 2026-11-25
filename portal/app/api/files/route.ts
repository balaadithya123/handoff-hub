import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../lib/portal";
import { filesDelete } from "../../../lib/connections";

export const dynamic = "force-dynamic";

/** Permanently deletes one shared file from the signed-in account's library. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hub = typeof body?.hub_user === "string" ? body.hub_user : "";
  const file = typeof body?.file_id === "string" ? body.file_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(hub) || !/^[0-9a-f-]{36}$/i.test(file)) {
    return NextResponse.json({ error: "Invalid file." }, { status: 400 });
  }
  try {
    const d = await filesDelete(token, hub, file);
    return NextResponse.json({ ok: true, name: d.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete the file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

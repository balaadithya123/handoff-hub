import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/portal";
import { filesPutText } from "../../../../lib/connections";

export const dynamic = "force-dynamic";

/** Saves converted Markdown into the chosen account's file library (3 MB max, always .md). */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const hub = typeof body?.hub_user === "string" ? body.hub_user : "";
  const name = typeof body?.name === "string" ? body.name.slice(0, 200) : "";
  const text = typeof body?.text === "string" ? body.text : "";
  if (!/^[0-9a-f-]{36}$/i.test(hub) || !name || !text) {
    return NextResponse.json({ error: "Missing name, text or account." }, { status: 400 });
  }
  try {
    const d = await filesPutText(token, hub, name, text, "Converted from PDF in the Axon portal");
    return NextResponse.json({ ok: true, name: d.name, file_id: d.file_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

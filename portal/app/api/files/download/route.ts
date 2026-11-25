import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/portal";
import { filesDownloadUrl } from "../../../../lib/connections";

export const dynamic = "force-dynamic";

/** Sends the browser to a one-hour download link for a file in the signed-in account's library. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const hub = req.nextUrl.searchParams.get("hub_user") || "";
  const file = req.nextUrl.searchParams.get("file") || "";
  if (!/^[0-9a-f-]{36}$/i.test(hub) || !/^[0-9a-f-]{36}$/i.test(file)) {
    return NextResponse.json({ error: "Invalid file." }, { status: 400 });
  }
  try {
    const d = await filesDownloadUrl(token, hub, file);
    const res = NextResponse.redirect(d.url, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not export the file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

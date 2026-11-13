import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/portal";
import { exportProject } from "../../../../lib/connections";

export const dynamic = "force-dynamic";

/** Downloads one project's full history as a Markdown file. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const hub = req.nextUrl.searchParams.get("hub_user") || "";
  const project = req.nextUrl.searchParams.get("project") || "";
  if (!/^[0-9a-f-]{36}$/i.test(hub) || !/^[a-z0-9._-]{1,60}$/.test(project)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }
  try {
    const d = await exportProject(token, hub, project);
    return new NextResponse(d.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${d.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not export the project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

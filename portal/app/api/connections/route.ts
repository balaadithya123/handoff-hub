import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionUser } from "../../../lib/portal";
import { accountIdByEmail, connectionStatus } from "../../../lib/connections";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const user = await sessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = await accountIdByEmail(user.email);
  if (!id) return NextResponse.json({ error: "Portal account not found" }, { status: 401 });
  return NextResponse.json({ connections: await connectionStatus(id) });
}

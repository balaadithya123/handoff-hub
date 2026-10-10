import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import Home from "../page";

export const dynamic = "force-dynamic";

export default async function ToolsRoutePage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token);
  if (!user || !token) redirect("/login?next=/tools");

  return <Home searchParams={Promise.resolve({ tab: "tools" })} />;
}

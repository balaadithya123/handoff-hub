import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionUser } from "../../lib/portal";
import Home from "../page";

export const dynamic = "force-dynamic";

export default async function ActivityRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const user = await sessionUser(token);
  if (!user || !token) redirect("/login?next=/activity");

  const sp = (await searchParams) || {};
  const project = typeof sp.project === "string" ? sp.project : "";

  return <Home searchParams={Promise.resolve({ tab: "activity", project })} />;
}

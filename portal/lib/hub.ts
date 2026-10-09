/** Public Hub base URL and the MCP endpoint AI apps connect to. Safe to import in server and client code. */
export const HUB_URL = (process.env.NEXT_PUBLIC_HUB_URL || "https://handoff-mcp.vercel.app").replace(/\/$/, "");
export const MCP_URL = HUB_URL + "/mcp";

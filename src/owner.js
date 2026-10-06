// Some tools act with the Hub owner's private credentials (GITHUB_TOKEN, VERCEL_TOKEN).
// Only Hub users listed in HUB_OWNER_USER_IDS may use them. If the variable is unset, nobody can.
export function isOwner(userId) {
  const ids = (process.env.HUB_OWNER_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return Boolean(userId) && ids.includes(userId);
}

export function assertOwner(userId, tool) {
  if (!isOwner(userId)) {
    throw new Error(`${tool} uses the Handoff Hub owner's private account and is not available on your account. Connect your own apps in the portal and use app_call_tool instead.`);
  }
}

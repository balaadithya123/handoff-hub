export function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(s)) return "";
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  return h < 24 ? h + "h ago" : Math.floor(h / 24) + "d ago";
}

export const human = (s: string) => (s || "event").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** YYYY-MM-DD in UTC. Used to bucket events per day. */
export const dayKey = (iso: string): string => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
};

/** The last `n` UTC day keys, oldest first, ending today. */
export function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  return out;
}

/** Counts items per day for the given day keys. */
export function countByDay(isoDates: Array<string | undefined | null>, days: string[]): number[] {
  const idx = new Map(days.map((d, i) => [d, i]));
  const out = days.map(() => 0);
  for (const iso of isoDates) {
    if (!iso) continue;
    const i = idx.get(dayKey(iso));
    if (i !== undefined) out[i]++;
  }
  return out;
}

/** Date label such as "Today", "Yesterday" or "Tue, 7 Oct". Pass `utc` for the first (server-matching) render. */
export function dayLabel(iso: string, utc: boolean): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown date";
  const tz = utc ? "UTC" : undefined;
  const key = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(x);
  const today = new Date();
  if (key(d) === key(today)) return "Today";
  if (key(d) === key(new Date(today.getTime() - 86400000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(d);
}

/** Stable key for grouping by calendar day in the chosen time zone. */
export function dayGroupKey(iso: string, utc: boolean): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-CA", { timeZone: utc ? "UTC" : undefined }).format(d);
}

export function timeLabel(iso: string, utc: boolean): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: utc ? "UTC" : undefined, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

export function fullTime(iso: string, utc: boolean): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: utc ? "UTC" : undefined, dateStyle: "medium", timeStyle: "medium", hour12: false }).format(d) + (utc ? " UTC" : "");
}

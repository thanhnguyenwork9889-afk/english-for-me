// Pure date/streak helpers. Days are local calendar dates as "YYYY-MM-DD" strings
// (already converted to the user's timezone), so no timezone math happens here.

const DAY_MS = 24 * 3600 * 1000;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => fromUtc(toUtc(iso) + n * DAY_MS);

/** Monday of the ISO week containing `iso`. */
export function weekStart(iso: string): string {
  const dow = new Date(toUtc(iso)).getUTCDay(); // 0 = Sun
  return addDays(iso, -((dow + 6) % 7));
}

/** Today's date in an IANA timezone, e.g. todayIn("Asia/Ho_Chi_Minh"). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10); // unknown timezone → UTC
  }
}

export type Streak = {
  /** Consecutive study days ending today — or yesterday, if today isn't done yet. */
  current: number;
  best: number;
  studiedToday: boolean;
};

export function computeStreak(days: Iterable<string>, today: string): Streak {
  const set = new Set(days);
  const studiedToday = set.has(today);

  let current = 0;
  let cursor = studiedToday ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of [...set].filter((d) => d <= today).sort()) {
    const t = toUtc(d);
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }

  return { current, best: Math.max(best, current), studiedToday };
}

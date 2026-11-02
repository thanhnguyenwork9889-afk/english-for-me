// Pure schedule math. All dates are local calendar dates "YYYY-MM-DD" and times "HH:MM"
// in the user's timezone, so no timezone conversion happens here.
import { addDays } from "@/lib/progress/streak";

export type ScheduleRule = {
  /** ISO weekdays: 1 = Monday … 7 = Sunday. */
  daysOfWeek: number[];
  /** "HH:MM" or "HH:MM:SS" (Postgres `time`). */
  startTime: string;
  durationMin: number;
};

export type Occurrence = { date: string; time: string; durationMin: number };

/** ISO weekday (1 = Mon … 7 = Sun) of a local date. */
export function isoDow(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  return dow === 0 ? 7 : dow;
}

export const hhmm = (time: string) => time.slice(0, 5);

/** Occurrences from `fromDate` (inclusive) over the next `days` days. */
export function occurrencesBetween(rule: ScheduleRule, fromDate: string, days: number): Occurrence[] {
  const set = new Set(rule.daysOfWeek);
  if (!set.size) return [];
  const out: Occurrence[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    if (set.has(isoDow(date))) out.push({ date, time: hhmm(rule.startTime), durationMin: rule.durationMin });
  }
  return out;
}

/** Has this occurrence's start time already passed at local `now`? */
export const isPast = (o: Pick<Occurrence, "date" | "time">, now: { date: string; time: string }) =>
  o.date < now.date || (o.date === now.date && o.time < now.time);

type LessonLike = { id: string; estimatedMinutes: number };

/**
 * Fill each session with the next lessons in order until its minutes are used up
 * (always at least one lesson per session). Returns one entry per occurrence.
 */
export function assignLessons<L extends LessonLike>(occurrences: Occurrence[], lessons: L[]): L[][] {
  let i = 0;
  return occurrences.map((o) => {
    const batch: L[] = [];
    let used = 0;
    while (i < lessons.length) {
      const next = lessons[i];
      if (batch.length > 0 && used + next.estimatedMinutes > o.durationMin) break;
      batch.push(next);
      used += next.estimatedMinutes;
      i++;
    }
    return batch;
  });
}

/**
 * Local date of the session that finishes the last remaining lesson, if studying
 * on schedule from `now`. Null when there's no schedule or nothing left (or > ~3 years).
 */
export function projectFinishDate(
  rule: ScheduleRule,
  remainingLessons: LessonLike[],
  now: { date: string; time: string },
): string | null {
  if (!remainingLessons.length || !rule.daysOfWeek.length) return null;
  let left = remainingLessons;
  let from = now.date;
  for (let guard = 0; guard < 40; guard++) {
    const occ = occurrencesBetween(rule, from, 28).filter((o) => !isPast(o, now));
    const batches = assignLessons(occ, left);
    let consumed = 0;
    for (let k = 0; k < occ.length; k++) {
      consumed += batches[k].length;
      if (consumed >= left.length) return occ[k].date;
    }
    left = left.slice(consumed);
    from = addDays(from, 28);
  }
  return null;
}

/** Days between two local dates (b − a). */
export function daysBetween(a: string, b: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

/** Current local date + "HH:MM" in an IANA timezone. */
export function nowIn(timeZone: string, now: Date = new Date()): { date: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
  } catch {
    const iso = now.toISOString();
    return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
  }
}

export const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

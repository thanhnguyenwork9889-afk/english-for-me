// Pure shaping helpers for the progress charts. Dates are local calendar days
// ("YYYY-MM-DD") already converted to the user's timezone, so no timezone math here.
import { addDays, weekStart } from "@/lib/progress/streak";

export type DayPoint = { date: string; lessons: number; minutes: number };

/** A day in a chart: the totals plus where it sits relative to today. */
export type ChartDay = DayPoint & { future: boolean; today: boolean };

const point = (rows: Map<string, DayPoint>, date: string, today: string): ChartDay => ({
  date,
  lessons: rows.get(date)?.lessons ?? 0,
  minutes: rows.get(date)?.minutes ?? 0,
  future: date > today,
  today: date === today,
});

const index = (rows: Iterable<DayPoint>) => new Map([...rows].map((r) => [r.date, r]));

/** Gap-free series of the `days` days ending on `today` (inclusive). */
export function daySeries(rows: Iterable<DayPoint>, today: string, days: number): ChartDay[] {
  const map = index(rows);
  const first = addDays(today, -(days - 1));
  return Array.from({ length: days }, (_, i) => point(map, addDays(first, i), today));
}

/**
 * 0 when nothing was studied, else 1–4 by quartile of `busiest`.
 * The scale is relative so a 20-minute learner and a 2-hour learner both see contrast.
 */
export function level(minutes: number, busiest: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (busiest <= 0) return 1;
  const q = Math.ceil((minutes / busiest) * 4);
  return Math.min(4, Math.max(1, q)) as 1 | 2 | 3 | 4;
}

export type Calendar = {
  /** Oldest week first; each week is Mon→Sun. */
  weeks: ChartDay[][];
  /** Minutes on the busiest day in range — the top of the colour scale. */
  busiest: number;
  /** Column index → month label key ("YYYY-MM"), only where the month changes. */
  months: { column: number; month: string }[];
};

/** Mon-first grid of the `weeks` ISO weeks ending in today's week. */
export function calendarWeeks(rows: Iterable<DayPoint>, today: string, weeks: number): Calendar {
  const map = index(rows);
  const firstMonday = addDays(weekStart(today), -(weeks - 1) * 7);
  const grid = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => point(map, addDays(firstMonday, w * 7 + d), today)),
  );

  const months: Calendar["months"] = [];
  let previous = "";
  grid.forEach((week, column) => {
    // Label a column by the month its Monday falls in, but only on a change.
    const month = week[0].date.slice(0, 7);
    if (month !== previous) {
      months.push({ column, month });
      previous = month;
    }
  });

  const busiest = grid.flat().reduce((max, d) => Math.max(max, d.minutes), 0);
  return { weeks: grid, busiest, months };
}

/** Share of finished sessions that were actually studied, as a whole percent. */
export function attendanceRate(done: number, missed: number): number {
  const total = done + missed;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** Rounded "nice" axis maximum at or above `value` (0 → 0). */
export function axisMax(value: number): number {
  if (value <= 0) return 0;
  const step = value <= 60 ? 15 : value <= 240 ? 30 : 60;
  return Math.ceil(value / step) * step;
}

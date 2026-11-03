import { formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { DayPoint } from "@/lib/stats/calendar";

/**
 * The table view the charts are built from: every study day with its figures. Collapsed
 * by default, so the charts stay the headline, but nothing is reachable by hover alone.
 */
export function ActivityTable({
  days,
  locale,
  t,
  ts,
}: {
  /** Study days, oldest first. */
  days: DayPoint[];
  locale: Locale;
  t: Dictionary["insights"];
  ts: Dictionary["stats"];
}) {
  const rows = [...days].reverse();
  const totals = days.reduce((s, d) => ({ lessons: s.lessons + d.lessons, minutes: s.minutes + d.minutes }), {
    lessons: 0,
    minutes: 0,
  });

  return (
    <details className="rounded-2xl border border-black/5 dark:border-white/10">
      <summary className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
        {t.tableView}
      </summary>
      <div className="max-h-80 overflow-y-auto px-4 pb-4">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">{ts.noActivity}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background text-left text-zinc-500">
              <tr>
                <th scope="col" className="py-2 font-medium">{t.colDate}</th>
                <th scope="col" className="py-2 text-right font-medium">{t.colLessons}</th>
                <th scope="col" className="py-2 text-right font-medium">{t.colMinutes}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.date} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-1.5">{formatDate(d.date, locale)}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.lessons}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.minutes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-black/10 font-medium dark:border-white/15">
              <tr>
                <th scope="row" className="py-2 text-left">{t.colTotal}</th>
                <td className="py-2 text-right tabular-nums">{totals.lessons}</td>
                <td className="py-2 text-right tabular-nums">{totals.minutes}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </details>
  );
}

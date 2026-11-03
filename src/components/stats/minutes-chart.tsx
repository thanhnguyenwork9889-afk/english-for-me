import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { axisMax, type ChartDay } from "@/lib/stats/calendar";
import { fillBar, fillFuture, gridline, tooltipAlign, tooltipCls } from "./scale";

const PLOT_H = 150; // px — tall enough to read small differences, short enough for a phone

/** Percent of the axis, to one decimal (so inline styles stay short). */
const share = (value: number, top: number) => Math.round((value / top) * 1000) / 10;

/**
 * Minutes studied per day, one series, with the daily target drawn as a reference line.
 * Single series, so no legend: the heading names it. Only the busiest day is labelled;
 * the rest are on hover, in the accessible name, and in the page's table view.
 */
export function MinutesChart({
  days,
  goalMinutes,
  t,
  ts,
}: {
  days: ChartDay[];
  /** Daily minutes target, from the weekly goal. 0 hides the reference line. */
  goalMinutes: number;
  t: Dictionary["insights"];
  ts: Dictionary["stats"];
}) {
  const busiest = days.reduce((max, d) => Math.max(max, d.minutes), 0);
  const top = Math.max(axisMax(Math.max(busiest, goalMinutes)), 30);
  const goalPct = goalMinutes > 0 ? Math.min(100, share(goalMinutes, top)) : 0;

  return (
    <figure className="m-0">
      <div className="flex gap-2">
        {/* Y axis: the two numbers that bound the plot. The rest is on hover. */}
        <ol className="flex w-9 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-zinc-500 tabular-nums" style={{ height: PLOT_H }}>
          <li>{top}</li>
          <li>0</li>
        </ol>

        <div className="min-w-0 flex-1">
          <div className={`relative border-b ${gridline}`} style={{ height: PLOT_H }}>
            {goalMinutes > 0 && (
              <div
                aria-hidden
                className="absolute inset-x-0 border-t border-zinc-400 dark:border-zinc-500"
                style={{ bottom: `${goalPct}%` }}
              >
                <span className="absolute -top-2 right-0 rounded bg-background px-1 text-[10px] leading-4 text-zinc-500">
                  {format(t.dailyTarget, { m: goalMinutes })}
                </span>
              </div>
            )}

            <ol className="flex h-full items-end gap-[3px]">
              {days.map((day, i) => {
                // Floor at 2% so a day with a couple of minutes is still a visible mark.
                const pct = day.minutes > 0 ? Math.max(2, share(day.minutes, top)) : 0;
                const detail = day.future
                  ? t.notYet
                  : day.lessons > 0
                    ? format(ts.dayDetail, { n: day.lessons, m: day.minutes })
                    : ts.noActivity;
                return (
                  <li key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                    {/* Full-height hit area, so hovering anywhere in the band shows the day. */}
                    <span tabIndex={0} aria-label={`${day.date}: ${detail}`} className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    {day.minutes > 0 && (
                      <span
                        aria-hidden
                        className={`w-full max-w-6 rounded-t-[4px] ${day.future ? fillFuture : fillBar}`}
                        style={{ height: `${pct}%` }}
                      />
                    )}
                    {day.minutes === busiest && busiest > 0 && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold leading-none text-zinc-600 tabular-nums dark:text-zinc-300"
                        style={{ bottom: `calc(${pct}% + 3px)` }}
                      >
                        {day.minutes}
                      </span>
                    )}
                    <span className={`${tooltipCls} ${tooltipAlign(i, days.length)}`}>
                      {day.date} · {detail}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <ol className="mt-1.5 flex gap-[3px] text-center text-[10px] leading-none text-zinc-500 tabular-nums">
            {days.map((day) => (
              <li key={day.date} className={`min-w-0 flex-1 ${day.today ? "font-semibold text-zinc-900 dark:text-white" : ""}`}>
                {Number(day.date.slice(8, 10))}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  );
}

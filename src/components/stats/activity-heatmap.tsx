import { format, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { level, type Calendar } from "@/lib/stats/calendar";
import { fillByLevel, fillFuture, tooltipAlign, tooltipCls } from "./scale";

/**
 * Study calendar: one cell per day, darker = more minutes. Sequential single hue, so
 * magnitude is readable without a legend of names; the scale strip below says what the
 * shades mean and the table view carries every value.
 */
export function ActivityHeatmap({
  calendar,
  locale,
  t,
  ts,
}: {
  calendar: Calendar;
  locale: Locale;
  t: Dictionary["insights"];
  ts: Dictionary["stats"];
}) {
  const { weeks, busiest, months } = calendar;
  const monthAt = new Map(months.map((m) => [m.column, monthName(m.month, locale)]));

  return (
    <figure className="m-0">
      {/* `overflow-x-auto` also clips vertically, so the top row's tooltip needs room inside. */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 pt-4">
        {/* Weekday gutter: every other row, so the labels never crowd the cells. */}
        <ol className="mt-[19px] grid shrink-0 grid-rows-7 gap-[3px] text-[10px] leading-none text-zinc-500">
          {ts.weekdays.map((d, i) => (
            <li key={d} className="grid h-3.5 items-center pr-0.5">
              {i % 2 === 0 ? d : ""}
            </li>
          ))}
        </ol>

        <div className="flex gap-[3px]">
          {weeks.map((week, column) => (
            <div key={week[0].date} className="flex flex-col gap-[3px]">
              <span className="h-4 whitespace-nowrap text-[10px] leading-4 text-zinc-500">
                {monthAt.get(column) ?? ""}
              </span>
              {week.map((day) => {
                const detail = day.future
                  ? t.notYet
                  : day.lessons > 0
                    ? format(ts.dayDetail, { n: day.lessons, m: day.minutes })
                    : ts.noActivity;
                return (
                  <div key={day.date} className="group relative">
                    <div
                      tabIndex={0}
                      aria-label={`${day.date}: ${detail}`}
                      className={`size-3.5 rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        day.future ? fillFuture : fillByLevel[level(day.minutes, busiest)]
                      } ${day.today ? "ring-2 ring-indigo-600 ring-offset-1 ring-offset-background dark:ring-indigo-400" : ""}`}
                    />
                    <span className={`${tooltipCls} ${tooltipAlign(column, weeks.length)}`}>
                      {day.date} · {detail}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Scale strip: what the shades mean, in the same steps the cells use. */}
      <figcaption className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
        <span>{t.less}</span>
        {fillByLevel.map((fill, i) => (
          <span key={i} aria-hidden className={`size-3 rounded-[3px] ${fill}`} />
        ))}
        <span>{t.more}</span>
        {busiest > 0 && <span className="ml-auto">{format(t.busiestDay, { m: busiest })}</span>}
      </figcaption>
    </figure>
  );
}

function monthName(month: string, locale: Locale): string {
  const [y, m] = month.split("-").map(Number);
  // Vietnamese "short" months are "Tháng 2" — too wide for a 14px column, and the obvious
  // abbreviation "T2" is already Monday in the weekday gutter. "Th2" stays unambiguous.
  if (locale === "vi") return `Th${m}`;
  return new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

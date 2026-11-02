import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { DayActivity } from "@/lib/progress/queries";

/** Mon–Sun row: filled = studied that day, ring = today. Hover/focus shows the day's totals. */
export function WeekStrip({
  days,
  today,
  planned = [],
  t,
}: {
  days: DayActivity[];
  today: string;
  /** Local dates that have a scheduled session (shown as a dot under the weekday). */
  planned?: string[];
  t: Dictionary["stats"];
}) {
  const plannedSet = new Set(planned);
  return (
    <ol className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const studied = d.lessons > 0;
        const isToday = d.date === today;
        const future = d.date > today;
        const detail = studied ? format(t.dayDetail, { n: d.lessons, m: d.minutes }) : t.noActivity;
        return (
          <li key={d.date} className="flex flex-col items-center gap-1.5">
            <span
              tabIndex={0}
              title={`${d.date} · ${detail}`}
              aria-label={`${t.weekdays[i]} ${d.date}: ${detail}`}
              className={`grid aspect-square w-full max-w-11 place-items-center rounded-xl text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                studied
                  ? "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950"
                  : future
                    ? "bg-black/[0.03] dark:bg-white/[0.03]"
                    : "bg-indigo-100 dark:bg-indigo-500/20"
              } ${isToday ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-background dark:ring-indigo-400" : ""}`}
            >
              {studied ? d.lessons : ""}
            </span>
            <span
              className={`text-xs ${isToday ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-500"}`}
            >
              {t.weekdays[i]}
            </span>
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${plannedSet.has(d.date) && !studied ? "bg-indigo-400" : "bg-transparent"}`}
            />
          </li>
        );
      })}
    </ol>
  );
}

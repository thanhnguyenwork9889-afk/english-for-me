import Link from "next/link";
import { format, formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { RoadmapSummary } from "@/lib/roadmaps/queries";
import { minutesToHours } from "@/lib/roadmaps/stats";
import { percent, ProgressMeter } from "@/components/progress/progress-meter";

export function RoadmapCards({
  roadmaps,
  locale,
  t,
  tp,
}: {
  roadmaps: RoadmapSummary[];
  locale: Locale;
  t: Dictionary["roadmaps"];
  tp: Dictionary["progress"];
}) {
  if (!roadmaps.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-zinc-500 dark:border-white/15">
        {t.empty}
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {roadmaps.map((r) => (
        <li key={r.id}>
          <Link
            href={`/${locale}/roadmaps/${r.id}`}
            className="block h-full rounded-2xl border border-black/5 p-5 transition hover:border-indigo-300 hover:shadow-sm dark:border-white/10 dark:hover:border-indigo-500/50"
          >
            <h3 className="font-semibold">{r.title}</h3>
            {r.goal && <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{r.goal}</p>}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>{format(t.lessons, { n: r.lessonCount })}</span>
              <span>{format(t.hours, { h: minutesToHours(r.totalMinutes) })}</span>
              <span>
                {r.targetDate ? format(t.deadline, { date: formatDate(r.targetDate, locale) }) : t.noDeadline}
              </span>
            </div>
            {r.lessonCount > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {format(tp.percent, { p: percent(r.completedCount, r.lessonCount) })}
                  </span>
                  <span className="text-zinc-500">{r.completedCount}/{r.lessonCount}</span>
                </div>
                <ProgressMeter
                  value={r.completedCount}
                  max={r.lessonCount}
                  label={format(tp.lessonsDone, { done: r.completedCount, total: r.lessonCount })}
                  size="sm"
                />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

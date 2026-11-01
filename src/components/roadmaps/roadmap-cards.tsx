import Link from "next/link";
import { format, formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { RoadmapSummary } from "@/lib/roadmaps/queries";
import { minutesToHours } from "@/lib/roadmaps/stats";

export function RoadmapCards({
  roadmaps,
  locale,
  t,
}: {
  roadmaps: RoadmapSummary[];
  locale: Locale;
  t: Dictionary["roadmaps"];
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
          </Link>
        </li>
      ))}
    </ul>
  );
}

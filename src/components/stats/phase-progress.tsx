import Link from "next/link";
import { percent, ProgressMeter } from "@/components/progress/progress-meter";
import { format, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PhaseProgress } from "@/lib/stats/queries";

/**
 * Lessons done per phase, kept in study order (the sequence is the point, so these are
 * not re-ranked by value). Each row prints its own figures, so the bar stays thin and
 * carries no text of its own.
 */
export function PhaseProgressList({
  phases,
  locale,
  t,
  tp,
}: {
  phases: PhaseProgress[];
  locale: Locale;
  t: Dictionary["insights"];
  tp: Dictionary["progress"];
}) {
  if (phases.length === 0) return <p className="text-sm text-zinc-500">{t.noPhases}</p>;

  // Group by roadmap, keeping the query's order (newest roadmap first, phases in order).
  const groups: { id: string; title: string; rows: PhaseProgress[] }[] = [];
  for (const row of phases) {
    const last = groups.at(-1);
    if (last?.id === row.roadmapId) last.rows.push(row);
    else groups.push({ id: row.roadmapId, title: row.roadmapTitle, rows: [row] });
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const total = group.rows.reduce((s, r) => s + r.total, 0);
        const done = group.rows.reduce((s, r) => s + r.done, 0);
        return (
          <section key={group.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link href={`/${locale}/roadmaps/${group.id}`} className="font-semibold hover:underline">
                {group.title}
              </Link>
              <span className="text-sm text-zinc-500 tabular-nums">
                {format(tp.lessonsDone, { done, total })} · {percent(done, total)}%
              </span>
            </div>
            <ol className="space-y-2.5">
              {group.rows.map((row) => (
                <li key={row.phaseId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
                  <span className="truncate text-sm">{row.phaseTitle}</span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {row.done}/{row.total}
                  </span>
                  <ProgressMeter
                    value={row.done}
                    max={row.total}
                    label={`${row.phaseTitle}: ${format(tp.lessonsDone, { done: row.done, total: row.total })}`}
                    size="sm"
                    className="col-span-2"
                  />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

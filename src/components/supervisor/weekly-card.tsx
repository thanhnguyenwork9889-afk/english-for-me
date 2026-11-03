import { ProgressMeter } from "@/components/progress/progress-meter";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { WeeklyReport } from "@/lib/supervisor/rules";

/** Last week in four numbers, plus the one remark the Monday notification leads with. */
export function WeeklyCard({ report, t }: { report: WeeklyReport; t: Dictionary["supervisor"] }) {
  const w = t.weekly;
  const headline = (w.headlines as Record<string, string | undefined>)[report.headline.kind];
  const change = report.changePercent;

  return (
    <div className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold">{w.title}</h3>
        {change !== null && (
          <span
            className={`text-sm font-medium ${
              change >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {change >= 0 ? "▲" : "▼"} {format(w.change, { percent: Math.abs(change) })}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">{w.minutes}</dt>
          <dd className="text-xl font-semibold tabular-nums">{report.minutes}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{w.lessons}</dt>
          <dd className="text-xl font-semibold tabular-nums">{report.lessons}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{w.goal}</dt>
          <dd className="text-xl font-semibold tabular-nums">{report.goalPercent}%</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">{w.reviewDue}</dt>
          <dd className="text-xl font-semibold tabular-nums">{report.reviewDue}</dd>
        </div>
      </dl>

      <ProgressMeter
        value={report.minutes}
        max={report.goalMinutes}
        label={format(w.goalLabel, { done: report.minutes, goal: report.goalMinutes })}
        className="mt-4"
      />

      {headline && <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{headline}</p>}
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { StatTile } from "@/components/progress/stat-tile";
import { ActivityHeatmap } from "@/components/stats/activity-heatmap";
import { ActivityTable } from "@/components/stats/activity-table";
import { AttendanceCard } from "@/components/stats/attendance-card";
import { MinutesChart } from "@/components/stats/minutes-chart";
import { PhaseProgressList } from "@/components/stats/phase-progress";
import { InsightList } from "@/components/supervisor/insight-list";
import { WeeklyCard } from "@/components/supervisor/weekly-card";
import { format, type Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { calendarWeeks, daySeries } from "@/lib/stats/calendar";
import { getProgressReport } from "@/lib/stats/queries";
import { getSupervisorFacts } from "@/lib/supervisor/queries";
import { buildInsights, weeklyReport } from "@/lib/supervisor/rules";

const BAR_DAYS = 14;
const HEATMAP_WEEKS = 16;

export default async function ProgressPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{dict.insights.title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{dict.insights.subtitle}</p>
        {/* The session is read per request, so the report streams in behind Suspense. */}
        <Suspense fallback={<p className="mt-8 text-zinc-500">{dict.insights.loading}</p>}>
          <Report locale={locale} dict={dict} />
        </Suspense>
      </main>
    </>
  );
}

async function Report({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const userId = await requireUserId(locale);
  const [report, facts] = await Promise.all([getProgressReport(userId), getSupervisorFacts(userId)]);
  const insights = buildInsights(facts);
  const weekly = weeklyReport(facts);
  const t = dict.insights;
  const ts = dict.stats;
  const { totals, today, days } = report;

  const bars = daySeries(days, today, BAR_DAYS);
  const calendar = calendarWeeks(days, today, HEATMAP_WEEKS);
  const hours = Math.round((totals.minutes / 60) * 10) / 10;

  return (
    <div className="mt-8 space-y-10">
      {totals.lessons === 0 && (
        <p className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          {t.empty}{" "}
          <Link href={`/${locale}/dashboard`} className="font-medium text-indigo-600 hover:underline">
            {t.emptyCta}
          </Link>
        </p>
      )}

      {/* The supervisor's read on the numbers comes first: it says what to do about them. */}
      <section>
        <h2 className="text-lg font-semibold">{dict.supervisor.title}</h2>
        <p className="mb-4 text-sm text-zinc-500">{dict.supervisor.subtitle}</p>
        <InsightList insights={insights} locale={locale} t={dict.supervisor} />
      </section>

      <section>
        <WeeklyCard report={weekly} t={dict.supervisor} />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon="📚" label={ts.total} value={String(totals.lessons)} caption={ts.allTime} />
        <StatTile icon="⏱️" label={t.totalTime} value={format(t.hours, { h: hours })} caption={format(t.minutesTotal, { m: totals.minutes })} />
        <StatTile
          icon="🔥"
          label={ts.streak}
          value={format(ts.days, { n: totals.currentStreak })}
          caption={format(ts.best, { n: totals.bestStreak })}
        />
        <StatTile icon="📅" label={t.activeDays} value={String(totals.activeDays)} caption={t.activeDaysHint} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">{format(t.minutesPerDay, { n: BAR_DAYS })}</h2>
        <p className="mb-4 text-sm text-zinc-500">{t.minutesPerDayHint}</p>
        <MinutesChart days={bars} goalMinutes={report.dailyGoalMinutes} t={t} ts={ts} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">{format(t.calendar, { n: HEATMAP_WEEKS })}</h2>
        <p className="mb-4 text-sm text-zinc-500">{t.calendarHint}</p>
        <ActivityHeatmap calendar={calendar} locale={locale} t={t} ts={ts} />
      </section>

      <section className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-lg font-semibold">{t.attendance}</h2>
          <p className="mb-4 text-sm text-zinc-500">{t.attendanceHint}</p>
          <AttendanceCard attendance={report.attendance} t={t} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t.byPhase}</h2>
          <p className="mb-4 text-sm text-zinc-500">{t.byPhaseHint}</p>
          <PhaseProgressList phases={report.phases} locale={locale} t={t} tp={dict.progress} />
        </div>
      </section>

      <ActivityTable days={days} locale={locale} t={t} ts={ts} />
    </div>
  );
}

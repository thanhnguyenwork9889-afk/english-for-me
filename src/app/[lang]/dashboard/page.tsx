import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { ContinueCard } from "@/components/progress/continue-card";
import { ProgressMeter } from "@/components/progress/progress-meter";
import { StatTile } from "@/components/progress/stat-tile";
import { WeekStrip } from "@/components/progress/week-strip";
import { RoadmapCards } from "@/components/roadmaps/roadmap-cards";
import { format, type Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { getUserEmail, requireUserId } from "@/lib/auth";
import { getProfile, profileLabel } from "@/lib/profile/queries";
import { getLearningStats, getNextLesson } from "@/lib/progress/queries";
import { dayLabel } from "@/lib/schedule/format";
import { getAgenda } from "@/lib/schedule/queries";
import { listRoadmaps } from "@/lib/roadmaps/queries";
import { templateCards } from "@/lib/templates";
import { TemplateGallery } from "@/components/roadmaps/template-gallery";

export default async function DashboardPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {/* Session read happens at request time, so it streams behind Suspense. */}
        <Suspense fallback={<p className="text-zinc-500">{dict.dashboard.loading}</p>}>
          <UserDashboard locale={locale} dict={dict} />
        </Suspense>
      </main>
    </>
  );
}

async function UserDashboard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const userId = await requireUserId(locale);
  const [profile, email, roadmaps, stats, next, agenda] = await Promise.all([
    getProfile(userId),
    getUserEmail(),
    listRoadmaps(userId),
    getLearningStats(userId),
    getNextLesson(userId),
    getAgenda(userId, 7),
  ]);
  const upcoming = agenda.items.find((i) => !i.past);
  const nextSession = upcoming
    ? `${dict.schedule.nextSession}: ${format(dict.schedule.at, {
        day: dayLabel(upcoming.date, agenda.now.date, locale, dict.schedule),
        time: upcoming.time,
      })}`
    : null;
  const name = profile ? profileLabel(profile) : email;
  const t = dict.dashboard;
  const ts = dict.stats;
  const { streak, week } = stats;

  const streakCaption = streak.studiedToday
    ? ts.studiedToday
    : streak.current > 0
      ? ts.keepGoing
      : ts.startStreak;
  const goalReached = week.minutes >= week.goalMinutes && week.goalMinutes > 0;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">
        {t.greeting}, {name ?? "👋"}
      </h1>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon="🔥"
          label={ts.streak}
          value={format(streak.current === 1 ? ts.day : ts.days, { n: streak.current })}
          caption={`${streakCaption} · ${format(ts.best, { n: streak.best })}`}
        />
        <StatTile icon="✅" label={ts.weekLessons} value={String(week.lessons)} />
        <StatTile
          icon="⏱️"
          label={ts.weekMinutes}
          value={String(week.minutes)}
          caption={goalReached ? ts.goalReached : format(ts.goal, { m: week.goalMinutes })}
        >
          <ProgressMeter
            value={week.minutes}
            max={week.goalMinutes}
            label={`${week.minutes} ${format(ts.goal, { m: week.goalMinutes })}`}
            size="sm"
          />
        </StatTile>
        <StatTile icon="📚" label={ts.total} value={String(stats.totalCompleted)} caption={ts.allTime} />
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">{ts.weekActivity}</h2>
            <Link href={`/${locale}/progress`} className="text-sm font-medium text-indigo-600 hover:underline">
              {dict.insights.title} →
            </Link>
          </div>
          <WeekStrip days={week.days} today={stats.today} planned={agenda.items.map((i) => i.date)} t={ts} />
        </div>
        <div>
          {next ? (
            <ContinueCard
              next={next}
              locale={locale}
              t={ts}
              tp={dict.progress}
              minutesLabel={dict.roadmaps.minutes}
              nextSession={nextSession}
            />
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
              {ts.noNext}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.yourRoadmaps}</h2>
          <Link href={`/${locale}/roadmaps`} className="text-sm font-medium text-indigo-600 hover:underline">
            {roadmaps.length ? t.viewAll : `+ ${dict.roadmaps.new}`}
          </Link>
        </div>
        {roadmaps.length > 0 ? (
          <RoadmapCards roadmaps={roadmaps.slice(0, 4)} locale={locale} t={dict.roadmaps} tp={dict.progress} />
        ) : (
          <TemplateGallery templates={templateCards()} lang={locale} t={dict.templates} />
        )}
      </section>
    </div>
  );
}

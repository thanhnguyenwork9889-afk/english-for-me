import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { SeedExercises } from "@/components/practice/seed-exercises";
import { RoadmapBoard } from "@/components/roadmaps/roadmap-board";
import { RoadmapHeader } from "@/components/roadmaps/roadmap-header";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { getRoadmapTree } from "@/lib/roadmaps/queries";
import { hoursPerWeekNeeded, minutesToHours } from "@/lib/roadmaps/stats";
import { getRoadmapForecast } from "@/lib/schedule/queries";
import { exercisesForTitle } from "@/lib/templates";
import { ScheduleCard } from "@/components/schedule/schedule-card";

export default async function RoadmapPage({ params }: PageProps<"/[lang]/roadmaps/[id]">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.roadmaps;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href={`/${locale}/roadmaps`} className="text-sm text-zinc-500 hover:underline">
          ← {t.back}
        </Link>
        {/* params + session are request-time data: await them inside Suspense. */}
        <Suspense fallback={<p className="mt-6 text-zinc-500">{t.loading}</p>}>
          <RoadmapDetail params={params} locale={locale} t={t} tp={dict.progress} tv={dict.lessonView} tpr={dict.practice} tsp={dict.speaking} ts={dict.schedule} />
        </Suspense>
      </main>
    </>
  );
}

async function RoadmapDetail({
  params,
  locale,
  t,
  tp,
  tv,
  tpr,
  tsp,
  ts,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
  t: Dictionary["roadmaps"];
  tp: Dictionary["progress"];
  tv: Dictionary["lessonView"];
  tpr: Dictionary["practice"];
  tsp: Dictionary["speaking"];
  ts: Dictionary["schedule"];
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const userId = await requireUserId(locale);
  const [roadmap, forecast] = await Promise.all([getRoadmapTree(userId, id), getRoadmapForecast(userId, id)]);
  if (!roadmap) notFound();

  const allLessons = roadmap.phases.flatMap((p) => p.lessons);
  const totalMinutes = allLessons.reduce((s, l) => s + l.estimatedMinutes, 0);
  // Lessons from a template that predate the practice feature: offer to attach questions.
  const missingExercises = allLessons.filter(
    (l) => l.exerciseCount === 0 && exercisesForTitle(l.title).length > 0,
  ).length;

  return (
    <div className="mt-4 space-y-8">
      <RoadmapHeader
        roadmap={roadmap}
        lessonCount={allLessons.length}
        doneCount={allLessons.filter((l) => l.completed).length}
        totalHours={minutesToHours(totalMinutes)}
        pace={hoursPerWeekNeeded(totalMinutes, roadmap.targetDate)}
        locale={locale}
        t={t}
        tp={tp}
      />
      <ScheduleCard
        roadmapId={roadmap.id}
        schedule={forecast.schedule}
        finishDate={forecast.finishDate}
        targetDate={roadmap.targetDate}
        remainingCount={allLessons.filter((l) => !l.completed).length}
        locale={locale}
        t={ts}
      />
      {missingExercises > 0 && <SeedExercises roadmapId={roadmap.id} missing={missingExercises} t={tpr} />}
      <RoadmapBoard roadmapId={roadmap.id} phases={roadmap.phases} t={t} tp={tp} tv={tv} tpr={tpr} tsp={tsp} />
    </div>
  );
}

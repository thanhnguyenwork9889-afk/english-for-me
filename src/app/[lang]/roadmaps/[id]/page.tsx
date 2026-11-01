import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { RoadmapBoard } from "@/components/roadmaps/roadmap-board";
import { RoadmapHeader } from "@/components/roadmaps/roadmap-header";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { getRoadmapTree } from "@/lib/roadmaps/queries";
import { hoursPerWeekNeeded, minutesToHours } from "@/lib/roadmaps/stats";

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
          <RoadmapDetail params={params} locale={locale} t={t} />
        </Suspense>
      </main>
    </>
  );
}

async function RoadmapDetail({
  params,
  locale,
  t,
}: {
  params: Promise<{ id: string }>;
  locale: Locale;
  t: Dictionary["roadmaps"];
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const userId = await requireUserId(locale);
  const roadmap = await getRoadmapTree(userId, id);
  if (!roadmap) notFound();

  const allLessons = roadmap.phases.flatMap((p) => p.lessons);
  const totalMinutes = allLessons.reduce((s, l) => s + l.estimatedMinutes, 0);

  return (
    <div className="mt-4 space-y-8">
      <RoadmapHeader
        roadmap={roadmap}
        lessonCount={allLessons.length}
        totalHours={minutesToHours(totalMinutes)}
        pace={hoursPerWeekNeeded(totalMinutes, roadmap.targetDate)}
        locale={locale}
        t={t}
      />
      <RoadmapBoard roadmapId={roadmap.id} phases={roadmap.phases} t={t} />
    </div>
  );
}

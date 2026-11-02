import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { CreateRoadmapForm } from "@/components/roadmaps/create-roadmap-form";
import { RoadmapCards } from "@/components/roadmaps/roadmap-cards";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { listRoadmaps } from "@/lib/roadmaps/queries";
import { todayIso } from "@/lib/roadmaps/stats";
import { templateCards } from "@/lib/templates";
import { TemplateGallery } from "@/components/roadmaps/template-gallery";

export default async function RoadmapsPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.roadmaps;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <Suspense fallback={<p className="mt-8 text-zinc-500">{t.loading}</p>}>
          <RoadmapsContent locale={locale} t={t} tp={dict.progress} tt={dict.templates} />
        </Suspense>
      </main>
    </>
  );
}

async function RoadmapsContent({
  locale,
  t,
  tp,
  tt,
}: {
  locale: Locale;
  t: Dictionary["roadmaps"];
  tp: Dictionary["progress"];
  tt: Dictionary["templates"];
}) {
  const userId = await requireUserId(locale);
  const roadmaps = await listRoadmaps(userId);

  return (
    <>
      <div className="my-6 flex">
        <CreateRoadmapForm lang={locale} today={todayIso()} t={t} />
      </div>
      <RoadmapCards roadmaps={roadmaps} locale={locale} t={t} tp={tp} />
      <div className="mt-12">
        <TemplateGallery templates={templateCards()} lang={locale} t={tt} />
      </div>
    </>
  );
}

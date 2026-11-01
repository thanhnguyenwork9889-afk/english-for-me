import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { RoadmapCards } from "@/components/roadmaps/roadmap-cards";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { getUserEmail, requireUserId } from "@/lib/auth";
import { getProfile, profileLabel } from "@/lib/profile/queries";
import { listRoadmaps } from "@/lib/roadmaps/queries";

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
  const [profile, email, roadmaps] = await Promise.all([getProfile(userId), getUserEmail(), listRoadmaps(userId)]);
  const name = profile ? profileLabel(profile) : email;
  const t = dict.dashboard;

  return (
    <section>
      <h1 className="text-2xl font-bold">
        {t.greeting}, {name ?? "👋"}
      </h1>
      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.yourRoadmaps}</h2>
        <Link href={`/${locale}/roadmaps`} className="text-sm font-medium text-indigo-600 hover:underline">
          {roadmaps.length ? t.viewAll : `+ ${dict.roadmaps.new}`}
        </Link>
      </div>
      <RoadmapCards roadmaps={roadmaps.slice(0, 4)} locale={locale} t={dict.roadmaps} />
    </section>
  );
}

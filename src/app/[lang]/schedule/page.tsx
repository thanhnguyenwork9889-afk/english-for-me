import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { btnPrimary } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { getLearningStats } from "@/lib/progress/queries";
import { dayLabel } from "@/lib/schedule/format";
import { getAgenda, type AgendaItem } from "@/lib/schedule/queries";

export default async function SchedulePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.schedule;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <Suspense fallback={<p className="mt-8 text-zinc-500">{dict.roadmaps.loading}</p>}>
          <AgendaList locale={locale} t={t} minutesLabel={dict.roadmaps.minutes} />
        </Suspense>
      </main>
    </>
  );
}

async function AgendaList({
  locale,
  t,
  minutesLabel,
}: {
  locale: Locale;
  t: Dictionary["schedule"];
  minutesLabel: string;
}) {
  const userId = await requireUserId(locale);
  const [agenda, stats] = await Promise.all([getAgenda(userId), getLearningStats(userId)]);
  const studiedToday = stats.streak.studiedToday;

  if (!agenda.items.length) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/15">
        <p className="text-zinc-500">{t.emptyAgenda}</p>
        <Link href={`/${locale}/roadmaps`} className={`${btnPrimary} mt-4`}>{t.openRoadmaps}</Link>
      </div>
    );
  }

  const byDate = new Map<string, AgendaItem[]>();
  for (const item of agenda.items) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);

  return (
    <ol className="mt-8 space-y-6">
      {[...byDate.entries()].map(([date, items]) => (
        <li key={date}>
          <h2
            className={`mb-2 text-sm font-semibold ${
              date === agenda.now.date ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {dayLabel(date, agenda.now.date, locale, t)}
          </h2>
          <ul className="space-y-2">
            {items.map((item) => {
              const status = item.past ? (studiedToday ? "done" : "missed") : "upcoming";
              return (
                <li key={`${item.roadmapId}-${item.time}`}>
                  <Link
                    href={`/${locale}/roadmaps/${item.roadmapId}`}
                    className={`flex gap-4 rounded-2xl border p-4 transition hover:border-indigo-300 dark:hover:border-indigo-500/50 ${
                      item.past ? "border-black/5 opacity-70 dark:border-white/10" : "border-black/5 dark:border-white/10"
                    }`}
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-lg font-semibold tabular-nums">{item.time}</p>
                      <p className="text-xs text-zinc-500">{item.durationMin} {minutesLabel}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-zinc-500">{item.roadmapTitle}</p>
                      {item.lessons.length > 0 ? (
                        <ul className="mt-0.5 space-y-0.5">
                          {item.lessons.map((l) => (
                            <li key={l.id} className="truncate text-sm font-medium">{l.title}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-0.5 text-sm text-zinc-500">{item.past ? "—" : t.noLessonsLeft}</p>
                      )}
                    </div>
                    <span
                      className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        status === "done"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : status === "missed"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      }`}
                    >
                      {status === "done" ? `✓ ${t.done}` : status === "missed" ? `! ${t.missed}` : t.upcoming}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

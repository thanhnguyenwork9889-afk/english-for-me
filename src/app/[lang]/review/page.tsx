import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { ReviewSession } from "@/components/practice/review-session";
import { format, type Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { getReviewCounts, getReviewQueue } from "@/lib/practice/queries";

const BATCH = 10;

export default async function ReviewPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{dict.practice.review.title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{dict.practice.review.subtitle}</p>
        {/* The session is read per request, so the queue streams in behind Suspense. */}
        <Suspense fallback={<p className="mt-8 text-zinc-500">{dict.practice.loading}</p>}>
          <Queue locale={locale} dict={dict} />
        </Suspense>
      </main>
    </>
  );
}

async function Queue({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const userId = await requireUserId(locale);
  const t = dict.practice;
  const [counts, questions] = await Promise.all([getReviewCounts(userId), getReviewQueue(userId, BATCH)]);

  return (
    <div className="mt-8 space-y-6">
      {questions.length > 0 ? (
        <ReviewSession questions={questions} t={t} />
      ) : (
        <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center dark:border-white/15">
          <p className="text-3xl" aria-hidden>
            {counts.later > 0 ? "✅" : "🎯"}
          </p>
          <p className="mt-2 font-semibold">{counts.later > 0 ? t.review.caughtUp : t.review.none}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {counts.later > 0 ? format(t.review.laterHint, { n: counts.later }) : t.review.noneHint}
          </p>
          <Link href={`/${locale}/roadmaps`} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
            {t.review.toRoadmaps} →
          </Link>
        </div>
      )}

      <p className="text-sm text-zinc-500">{t.review.howItWorks}</p>
    </div>
  );
}

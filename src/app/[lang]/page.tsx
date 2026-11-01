import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

const featureKeys = ["roadmap", "checkoff", "reminders", "ai"] as const;
const featureIcons = { roadmap: "🗺️", checkoff: "✅", reminders: "⏰", ai: "🤖" } as const;

export default async function HomePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.home;

  return (
    <>
      <SiteHeader>
        <Link href={`/${locale}/login`} className="text-sm font-medium hover:underline">
          {dict.nav.login}
        </Link>
        <Link
          href={`/${locale}/signup`}
          className="hidden h-8 items-center rounded-full bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500 sm:inline-flex"
        >
          {dict.nav.signup}
        </Link>
      </SiteHeader>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-24">
        <section className="max-w-2xl">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {t.badge}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t.headline}</h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{t.subhead}</p>
          <Link
            href={`/${locale}/signup`}
            className="mt-8 inline-flex h-11 items-center rounded-full bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-500"
          >
            {t.cta} →
          </Link>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {featureKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-black/5 p-5 dark:border-white/10"
            >
              <div className="text-2xl">{featureIcons[key]}</div>
              <h2 className="mt-2 font-semibold">{t.features[key].title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.features[key].body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

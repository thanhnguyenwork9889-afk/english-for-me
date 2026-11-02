import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { SettingsForm } from "@/components/settings/settings-form";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { requireUserId } from "@/lib/auth";
import { getUserPrefs } from "@/lib/progress/queries";

export default async function SettingsPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.settings;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 mb-8 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <Suspense fallback={<p className="text-zinc-500">{dict.roadmaps.loading}</p>}>
          <SettingsContent locale={locale} t={t} />
        </Suspense>
      </main>
    </>
  );
}

async function SettingsContent({ locale, t }: { locale: Locale; t: Dictionary["settings"] }) {
  const userId = await requireUserId(locale);
  const prefs = await getUserPrefs(userId);
  const zones = Intl.supportedValuesOf("timeZone");
  return <SettingsForm initial={prefs} zones={zones} lang={locale} t={t} />;
}

import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { getUserEmail, requireUserId } from "@/lib/auth";
import { getProfile } from "@/lib/profile/queries";

export default async function ProfilePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.profile;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 mb-8 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <Suspense fallback={<p className="text-zinc-500">{dict.dashboard.loading}</p>}>
          <ProfileContent locale={locale} t={t} />
        </Suspense>
      </main>
    </>
  );
}

async function ProfileContent({ locale, t }: { locale: Locale; t: Dictionary["profile"] }) {
  const userId = await requireUserId(locale);
  const [profile, email] = await Promise.all([getProfile(userId), getUserEmail()]);

  return (
    <ProfileForm
      userId={userId}
      t={t}
      initial={{
        email: profile?.email ?? email ?? "",
        displayName: profile?.displayName ?? "",
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        avatarUrl: profile?.avatarUrl ?? "",
      }}
    />
  );
}

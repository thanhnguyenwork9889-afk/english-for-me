import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/get-dictionary";
import { getUserEmail, getUserId } from "@/lib/auth";
import { getProfile, profileLabel } from "@/lib/profile/queries";
import { AccountDropdown } from "./account-dropdown";
import { SiteHeader } from "./site-header";

const navLink =
  "text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white";

/** Header for signed-in pages: nav links + account menu. */
export async function AppHeader() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <SiteHeader homeHref={`/${locale}/dashboard`}>
      <nav className="hidden items-center gap-4 sm:flex">
        <Link href={`/${locale}/dashboard`} className={navLink}>{dict.nav.dashboard}</Link>
        <Link href={`/${locale}/roadmaps`} className={navLink}>{dict.nav.roadmaps}</Link>
        <Link href={`/${locale}/schedule`} className={navLink}>{dict.nav.schedule}</Link>
      </nav>
      {/* The session is read per request, so the menu streams in behind Suspense. */}
      <Suspense fallback={<span className="size-9 rounded-full bg-black/5 dark:bg-white/10" />}>
        <AccountMenu locale={locale} dict={dict} />
      </Suspense>
    </SiteHeader>
  );
}

async function AccountMenu({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const userId = await getUserId();
  if (!userId) {
    return (
      <Link href={`/${locale}/login`} className={navLink}>
        {dict.nav.login}
      </Link>
    );
  }
  const [profile, email] = await Promise.all([getProfile(userId), getUserEmail()]);
  const mail = profile?.email ?? email ?? "";
  const name = profile ? profileLabel(profile) : mail.split("@")[0];

  return (
    <AccountDropdown
      name={name}
      email={mail}
      avatarUrl={profile?.avatarUrl ?? null}
      lang={locale}
      menuLabel={dict.nav.menu}
      logoutLabel={dict.nav.logout}
      items={[
        { href: `/${locale}/dashboard`, label: dict.nav.dashboard, mobileOnly: true },
        { href: `/${locale}/roadmaps`, label: dict.nav.roadmaps, mobileOnly: true },
        { href: `/${locale}/schedule`, label: dict.nav.schedule, mobileOnly: true },
        { href: `/${locale}/profile`, label: dict.nav.profile },
        { href: `/${locale}/settings`, label: dict.nav.settings },
      ]}
    />
  );
}

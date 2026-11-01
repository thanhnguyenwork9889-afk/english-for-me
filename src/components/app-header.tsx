import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { signOut } from "@/lib/auth-actions";
import { SiteHeader } from "./site-header";

/** Header for signed-in pages: nav links + logout. */
export async function AppHeader() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const link = "text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white";

  return (
    <SiteHeader>
      <nav className="hidden items-center gap-4 sm:flex">
        <Link href={`/${locale}/dashboard`} className={link}>{dict.nav.dashboard}</Link>
        <Link href={`/${locale}/roadmaps`} className={link}>{dict.nav.roadmaps}</Link>
      </nav>
      <form action={signOut}>
        <input type="hidden" name="lang" value={locale} />
        <button type="submit" className={link}>{dict.nav.logout}</button>
      </form>
    </SiteHeader>
  );
}

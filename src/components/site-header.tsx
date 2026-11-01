import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { LanguageToggle } from "./language-toggle";

export async function SiteHeader({
  children,
  homeHref,
}: {
  children?: React.ReactNode;
  /** Where the logo points. Signed-in pages pass the dashboard so the logo never "logs you out" visually. */
  homeHref?: string;
}) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-background/80 backdrop-blur dark:border-white/10">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href={homeHref ?? `/${locale}`} className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-sm text-white">E</span>
          {dict.meta.title}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle current={locale} label={dict.nav.language} />
          {children}
        </div>
      </div>
    </header>
  );
}

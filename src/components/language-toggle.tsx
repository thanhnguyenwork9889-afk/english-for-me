"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, locales, switchLocalePath, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = { vi: "VI", en: "EN" };

/** Remember the choice so proxy.ts redirects "/" to this locale next time. */
function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageToggle({ current, label }: { current: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === current) return;
    persistLocale(next);
    // Read the path at click time (not via usePathname) so the header stays prerenderable on dynamic routes.
    const { pathname, search } = window.location;
    startTransition(() => router.push(switchLocalePath(pathname, next) + search));
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-black/10 bg-white/60 p-0.5 text-xs font-semibold dark:border-white/15 dark:bg-white/5"
      data-pending={pending || undefined}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === current}
          className={`rounded-full px-3 py-1 transition-colors ${
            l === current
              ? "bg-indigo-600 text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}

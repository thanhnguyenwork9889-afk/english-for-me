// Client-safe i18n config (no server-only imports here).
export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Replace the leading locale segment of a pathname: /vi/dashboard -> /en/dashboard */
export function switchLocalePath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (parts[1] && hasLocale(parts[1])) {
    parts[1] = next;
    return parts.join("/") || `/${next}`;
  }
  return `/${next}${pathname === "/" ? "" : pathname}`;
}

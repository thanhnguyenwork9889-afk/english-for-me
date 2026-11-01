import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";
import type en from "./dictionaries/en.json";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
};

/** Current locale from the root `[lang]` segment (Server Components only). */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

/** Dictionary for the current route's locale (Server Components only). */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}

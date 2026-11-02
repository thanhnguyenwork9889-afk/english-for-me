import type { Locale } from "@/i18n/config";
import { addDays } from "@/lib/progress/streak";

/** "Today" / "Tomorrow" / "Thursday, 5 Nov" for a local date. */
export function dayLabel(
  date: string,
  today: string,
  locale: Locale,
  t: { today: string; tomorrow: string },
): string {
  if (date === today) return t.today;
  if (date === addDays(today, 1)) return t.tomorrow;
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

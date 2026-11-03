import Link from "next/link";
import { format, formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Insight, InsightTone } from "@/lib/supervisor/rules";

const toneStyle: Record<InsightTone, { box: string; icon: string }> = {
  warn: { box: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10", icon: "⚠️" },
  info: { box: "border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-500/10", icon: "💡" },
  good: { box: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10", icon: "✅" },
};

type Copy = { title: string; body: string };

/** Dates arrive as ISO strings; show them the way the rest of the app does. */
function localize(vars: Insight["vars"], locale: Locale): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(vars).map(([key, value]) =>
      key.endsWith("Date") && typeof value === "string" ? [key, formatDate(value, locale)] : [key, value],
    ),
  );
}

/**
 * The supervisor's remarks. Each one is keyed by rule name, so the wording lives in the
 * dictionary and the rules stay language-free. An unknown key is skipped rather than
 * rendered half-empty — a test asserts both dictionaries cover every rule.
 */
export function InsightList({
  insights,
  locale,
  t,
}: {
  insights: Insight[];
  locale: Locale;
  t: Dictionary["supervisor"];
}) {
  const copies = t.insights as Record<string, Copy | undefined>;
  const rows = insights
    .map((insight) => ({ insight, copy: copies[insight.kind] }))
    .filter((row): row is { insight: Insight; copy: Copy } => Boolean(row.copy));

  if (rows.length === 0) return <p className="text-sm text-zinc-500">{t.none}</p>;

  return (
    <ul className="space-y-3">
      {rows.map(({ insight, copy }) => {
        const vars = localize(insight.vars, locale);
        const style = toneStyle[insight.tone];
        return (
          <li key={insight.kind + JSON.stringify(insight.vars)} className={`rounded-2xl border p-4 ${style.box}`}>
            <p className="font-semibold">
              <span aria-hidden>{style.icon}</span> {format(copy.title, vars)}
            </p>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{format(copy.body, vars)}</p>
            {insight.action && (
              <Link
                href={`/${locale}/${insight.action === "review" ? "review" : insight.action}`}
                className="mt-2 inline-block text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300"
              >
                {t.act[insight.action]} →
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

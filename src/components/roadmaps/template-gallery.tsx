"use client";

import { useActionState, useState } from "react";
import { btnPrimary } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createRoadmapFromTemplate, type TemplateState } from "@/lib/templates/actions";

export type TemplateCard = {
  id: string;
  title: string;
  goal: string;
  level: string;
  weeks: number;
  minutesPerDay: number;
  lessonCount: number;
  contentLocale: "vi" | "en";
  phaseTitles: string[];
};

export function TemplateGallery({
  templates,
  lang,
  t,
}: {
  templates: TemplateCard[];
  lang: string;
  t: Dictionary["templates"];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">✨ {t.title}</h2>
      <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((tpl) => (
          <TemplateItem key={tpl.id} tpl={tpl} lang={lang} t={t} />
        ))}
      </div>
    </section>
  );
}

function TemplateItem({ tpl, lang, t }: { tpl: TemplateCard; lang: string; t: Dictionary["templates"] }) {
  const [state, action, pending] = useActionState<TemplateState, FormData>(createRoadmapFromTemplate, {});
  const [showPhases, setShowPhases] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <h3 className="font-semibold">{tpl.title}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{tpl.goal}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {[
          `📶 ${tpl.level}`,
          `📅 ${format(t.weeks, { n: tpl.weeks })}`,
          `📚 ${format(t.lessons, { n: tpl.lessonCount })}`,
          `⏱️ ${format(t.perDay, { m: tpl.minutesPerDay })}`,
          `🌐 ${tpl.contentLocale === "vi" ? t.contentVi : t.contentEn}`,
        ].map((chip) => (
          <span key={chip} className="rounded-full bg-white/70 px-2 py-0.5 text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
            {chip}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowPhases((v) => !v)}
        className="mt-3 self-start text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300"
        aria-expanded={showPhases}
      >
        {showPhases ? t.hidePhases : t.showPhases}
      </button>
      {showPhases && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {tpl.phaseTitles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      )}

      <form action={action} className="mt-4">
        <input type="hidden" name="templateId" value={tpl.id} />
        <input type="hidden" name="lang" value={lang} />
        <button type="submit" className={`${btnPrimary} w-full`} disabled={pending}>
          {pending ? t.creating : t.use}
        </button>
        {state.error && <p className="mt-2 text-sm text-red-600">{t.error}</p>}
      </form>
    </div>
  );
}

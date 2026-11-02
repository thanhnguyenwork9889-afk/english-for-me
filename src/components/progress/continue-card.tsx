"use client";

import Link from "next/link";
import { useState } from "react";
import { btnGhost, btnPrimary } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { NextLesson } from "@/lib/progress/queries";
import { CompleteDialog } from "./complete-dialog";

/** "Continue learning": the next unfinished lesson, with a one-click way to complete it. */
export function ContinueCard({
  next,
  locale,
  t,
  tp,
  minutesLabel,
  nextSession,
}: {
  next: NextLesson;
  locale: string;
  t: Dictionary["stats"];
  tp: Dictionary["progress"];
  minutesLabel: string;
  /** e.g. "Next session: Today at 20:00" */
  nextSession?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">▶ {t.continue}</p>
      <h3 className="mt-1 text-lg font-semibold">{next.lessonTitle}</h3>
      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
        {next.roadmapTitle} › {next.phaseTitle} · {next.estimatedMinutes} {minutesLabel}
      </p>
      {nextSession && <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">📅 {nextSession}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
          ✓ {tp.markDone}
        </button>
        <Link href={`/${locale}/roadmaps/${next.roadmapId}`} className={`${btnGhost} border border-black/10 dark:border-white/15`}>
          {t.open}
        </Link>
      </div>
      {open && (
        <CompleteDialog
          lesson={{ id: next.lessonId, title: next.lessonTitle, estimatedMinutes: next.estimatedMinutes }}
          t={tp}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

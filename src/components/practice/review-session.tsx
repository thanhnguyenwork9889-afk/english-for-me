"use client";

import { useState } from "react";
import { btnPrimary } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReviewQuestion } from "@/lib/practice/queries";
import { ExerciseRunner } from "./exercise-runner";

/**
 * Review session: a batch of due questions, behind a start button so the page doesn't
 * ambush the user with a question. Finishing refreshes the page, which fetches the
 * next batch, so going back to the start screen shows the updated count.
 */
export function ReviewSession({ questions, t }: { questions: ReviewQuestion[]; t: Dictionary["practice"] }) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="font-semibold">{format(t.review.ready, { n: questions.length })}</p>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{t.review.readyHint}</p>
        <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setStarted(true)}>
          {t.review.start}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
      <ExerciseRunner
        questions={questions.map((q) => ({ ...q, lessonTitle: q.lessonTitle }))}
        t={t}
        closeLabel={t.review.finish}
        onClose={() => setStarted(false)}
      />
    </div>
  );
}

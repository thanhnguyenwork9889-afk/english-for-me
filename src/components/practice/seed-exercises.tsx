"use client";

import { useState, useTransition } from "react";
import { btnPrimary } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { seedExercisesForRoadmap } from "@/lib/templates/actions";

/**
 * Shown on a roadmap whose lessons came from a template but have no questions yet —
 * roadmaps created before practice existed. One click attaches them.
 */
export function SeedExercises({
  roadmapId,
  missing,
  t,
}: {
  roadmapId: string;
  /** Lessons that have template questions available but none attached. */
  missing: number;
  t: Dictionary["practice"];
}) {
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function seed() {
    setError(false);
    startTransition(async () => {
      const res = await seedExercisesForRoadmap(roadmapId);
      if (res.ok) setDone(res.added);
      else setError(true);
    });
  }

  if (done !== null) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        ✅ {format(t.seed.added, { n: done })}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <p className="font-semibold">📝 {format(t.seed.title, { n: missing })}</p>
      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{t.seed.hint}</p>
      {error && <p className="mt-2 text-sm text-red-600">{t.error}</p>}
      <button type="button" className={`${btnPrimary} mt-3`} onClick={seed} disabled={pending}>
        {pending ? t.seed.adding : t.seed.cta}
      </button>
    </div>
  );
}

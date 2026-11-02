"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { btnGhost, btnPrimary, inputCls, labelCls, textareaCls } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { completeLesson } from "@/lib/progress/actions";

export type CompletableLesson = {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty?: number | null;
  actualMinutes?: number | null;
  progressNote?: string | null;
};

const faces = ["😄", "🙂", "😐", "😓", "🥵"];

/** "Nice work!" dialog: difficulty 1–5, actual minutes, note → completeLesson. */
export function CompleteDialog({
  lesson,
  onClose,
  onDone,
  t,
}: {
  lesson: CompletableLesson;
  onClose: () => void;
  /** Called after a successful save (before close). */
  onDone?: () => void;
  t: Dictionary["progress"];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [difficulty, setDifficulty] = useState<number | null>(lesson.difficulty ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function submit(formData: FormData) {
    setError(null);
    const minutes = Number(formData.get("actualMinutes"));
    startTransition(async () => {
      const res = await completeLesson({
        lessonId: lesson.id,
        difficulty,
        actualMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
        note: String(formData.get("note") ?? ""),
      });
      if (res.ok) {
        onDone?.();
        ref.current?.close();
      } else setError(t.error);
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <form action={submit} className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-semibold">{t.dialogTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {format(t.dialogSubtitle, { title: lesson.title })}
          </p>
        </div>

        <fieldset>
          <legend className={labelCls}>{t.difficulty}</legend>
          <div className="grid grid-cols-5 gap-2">
            {t.difficultyLevels.map((label, i) => {
              const value = i + 1;
              const active = difficulty === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDifficulty(active ? null : value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs transition-colors ${
                    active
                      ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
                      : "border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl" aria-hidden>{faces[i]}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label className={labelCls} htmlFor="c-min">{t.actualMinutes}</label>
          <input
            id="c-min"
            name="actualMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={lesson.actualMinutes ?? lesson.estimatedMinutes}
            className={`${inputCls} w-32`}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="c-note">{t.note}</label>
          <textarea
            id="c-note"
            name="note"
            rows={3}
            maxLength={2000}
            defaultValue={lesson.progressNote ?? ""}
            placeholder={t.notePlaceholder}
            className={textareaCls}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => ref.current?.close()}>
            {t.cancel}
          </button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? t.saving : `✓ ${t.save}`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { format, formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { deleteRoadmap, updateRoadmap } from "@/lib/roadmaps/actions";
import type { RoadmapTree } from "@/lib/roadmaps/queries";
import { btnDanger, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { percent, ProgressMeter } from "@/components/progress/progress-meter";

type Pace = { kind: "none" } | { kind: "overdue" } | { kind: "ok"; hours: number };

export function RoadmapHeader({
  roadmap,
  lessonCount,
  doneCount,
  totalHours,
  pace,
  locale,
  t,
  tp,
}: {
  roadmap: Pick<RoadmapTree, "id" | "title" | "goal" | "startDate" | "targetDate">;
  lessonCount: number;
  doneCount: number;
  totalHours: number;
  pace: Pace;
  locale: Locale;
  t: Dictionary["roadmaps"];
  tp: Dictionary["progress"];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateRoadmap({
        id: roadmap.id,
        title: String(formData.get("title") ?? ""),
        goal: String(formData.get("goal") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        targetDate: String(formData.get("targetDate") ?? ""),
      });
      if (res.ok) setEditing(false);
      else setError(res.error === "invalid" ? t.form.invalid : t.form.error);
    });
  }

  function onDelete() {
    if (!confirm(t.confirmDeleteRoadmap)) return;
    startTransition(async () => {
      const res = await deleteRoadmap(roadmap.id, locale);
      if (res && !res.ok) setError(t.form.error);
    });
  }

  if (editing) {
    return (
      <form action={onSubmit} className="space-y-4 rounded-2xl border border-black/5 p-5 dark:border-white/10">
        <div>
          <label className={labelCls} htmlFor="e-title">{t.form.title}</label>
          <input id="e-title" name="title" required maxLength={200} defaultValue={roadmap.title} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="e-goal">{t.form.goal}</label>
          <input id="e-goal" name="goal" maxLength={300} defaultValue={roadmap.goal ?? ""} className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="e-start">{t.form.startDate}</label>
            <input id="e-start" name="startDate" type="date" required defaultValue={roadmap.startDate} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="e-target">{t.form.targetDate}</label>
            <input id="e-target" name="targetDate" type="date" defaultValue={roadmap.targetDate ?? ""} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className={btnDanger} onClick={onDelete} disabled={pending}>{t.delete}</button>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => setEditing(false)}>{t.form.cancel}</button>
            <button type="submit" className={btnPrimary} disabled={pending}>
              {pending ? t.form.saving : t.form.save}
            </button>
          </div>
        </div>
      </form>
    );
  }

  const pct = percent(doneCount, lessonCount);
  const doneLabel = format(tp.lessonsDone, { done: doneCount, total: lessonCount });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold">{roadmap.title}</h1>
        {roadmap.goal && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{roadmap.goal}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
          <span>{format(t.started, { date: formatDate(roadmap.startDate, locale) })}</span>
          <span>
            {roadmap.targetDate
              ? format(t.deadline, { date: formatDate(roadmap.targetDate, locale) })
              : t.noDeadline}
          </span>
          <span>{format(t.lessons, { n: lessonCount })}</span>
          <span>{format(t.hours, { h: totalHours })}</span>
        </div>
        {pace.kind === "ok" && (
          <p className="mt-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {format(t.perWeek, { h: pace.hours })}
          </p>
        )}
        {pace.kind === "overdue" && (
          <p className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {t.overdue}
          </p>
        )}
      </div>
      <button type="button" className={btnGhost} onClick={() => setEditing(true)}>✏️ {t.edit}</button>

      {lessonCount > 0 && (
        <div className="w-full">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold">{format(tp.percent, { p: pct })}</span>
            <span className="text-zinc-500">{doneLabel}</span>
          </div>
          <ProgressMeter value={doneCount} max={lessonCount} label={doneLabel} />
          {doneCount === lessonCount && (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{tp.allDone}</p>
          )}
        </div>
      )}
    </div>
  );
}

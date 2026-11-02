"use client";

import { useState, useTransition } from "react";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { format, formatDate, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { saveSchedule } from "@/lib/schedule/actions";
import { daysBetween } from "@/lib/schedule/occurrences";

type T = Dictionary["schedule"];

export type ScheduleValue = { daysOfWeek: number[]; startTime: string; durationMin: number; active: boolean };

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

export function ScheduleCard({
  roadmapId,
  schedule,
  finishDate,
  targetDate,
  remainingCount,
  locale,
  t,
}: {
  roadmapId: string;
  schedule: ScheduleValue | null;
  finishDate: string | null;
  targetDate: string | null;
  remainingCount: number;
  locale: Locale;
  t: T;
}) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<number[]>(schedule?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [time, setTime] = useState((schedule?.startTime ?? "20:00").slice(0, 5));
  const [duration, setDuration] = useState(schedule?.durationMin ?? 30);
  const [active, setActive] = useState(schedule?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveSchedule({ roadmapId, daysOfWeek: days, startTime: time, durationMin: duration, active });
      if (res.ok) setEditing(false);
      else setError(res.error === "invalid" ? t.invalid : t.error);
    });
  }

  const dayNames = (list: number[]) => [...list].sort().map((d) => t.weekdaysShort[d - 1]).join(", ");

  if (editing) {
    return (
      <section className="space-y-4 rounded-2xl border border-black/5 p-5 dark:border-white/10">
        <h2 className="font-semibold">{t.cardTitle}</h2>
        <fieldset>
          <legend className={labelCls}>{t.days}</legend>
          <div className="flex flex-wrap gap-2">
            {t.weekdaysShort.map((label, i) => {
              const d = i + 1;
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={`h-10 min-w-12 rounded-xl border px-3 text-sm font-medium transition-colors ${
                    on
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-black/10 text-zinc-700 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="s-time">{t.time}</label>
            <input id="s-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-dur">{t.duration}</label>
            <select
              id="s-dur"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputCls}
            >
              {DURATIONS.map((m) => (
                <option key={m} value={m}>{format(t.minutes, { m })}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-indigo-600" />
          {t.active}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => setEditing(false)}>{t.cancel}</button>
          <button type="button" className={btnPrimary} onClick={save} disabled={pending}>
            {pending ? t.saving : t.save}
          </button>
        </div>
      </section>
    );
  }

  if (!schedule) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 p-5 dark:border-indigo-500/40 dark:bg-indigo-500/5">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t.cardTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.none}</p>
        </div>
        <button type="button" className={btnPrimary} onClick={() => setEditing(true)}>{t.setUp}</button>
      </section>
    );
  }

  const hoursPerWeek = Math.round(((schedule.daysOfWeek.length * schedule.durationMin) / 60) * 10) / 10;
  let paceNote: { text: string; tone: "good" | "warn" } | null = null;
  if (finishDate && targetDate) {
    const diff = daysBetween(finishDate, targetDate);
    paceNote =
      diff > 0
        ? { text: format(t.early, { n: diff }), tone: "good" }
        : diff === 0
          ? { text: t.onTime, tone: "good" }
          : { text: format(t.late, { n: -diff }), tone: "warn" };
  }

  return (
    <section className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">
            {t.cardTitle}
            {!schedule.active && (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {t.paused}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {format(t.summary, {
              days: dayNames(schedule.daysOfWeek),
              time: schedule.startTime.slice(0, 5),
              m: schedule.durationMin,
            })}{" "}
            <span className="text-zinc-500">· {format(t.perWeek, { h: hoursPerWeek })}</span>
          </p>
        </div>
        <button type="button" className={btnGhost} onClick={() => setEditing(true)}>✏️ {t.edit}</button>
      </div>

      {schedule.active && (
        <p className="mt-3 text-sm">
          {remainingCount === 0 ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-300">✓ {t.allDone}</span>
          ) : finishDate ? (
            <>
              🏁 {format(t.finish, { date: formatDate(finishDate, locale) })}
              {paceNote && (
                <span
                  className={`ml-1 font-medium ${
                    paceNote.tone === "good" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  — {paceNote.text}
                </span>
              )}
            </>
          ) : null}
        </p>
      )}
    </section>
  );
}

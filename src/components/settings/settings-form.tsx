"use client";

import { useActionState, useState } from "react";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import { saveLearningSettings, type SettingsState } from "@/lib/schedule/actions";
import { format } from "@/i18n/config";
import { quietWarning } from "@/lib/reminders/quiet-hours";
import { PushDevice } from "./push-device";

export type SettingsInitial = {
  timezone: string;
  weeklyGoalMinutes: number;
  pushEnabled: boolean;
  followupEnabled: boolean;
  remindBeforeMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export function SettingsForm({
  initial,
  zones,
  studyTimes,
  lang,
  t,
}: {
  initial: SettingsInitial;
  zones: string[];
  /** Active schedules' start times, to warn when do-not-disturb would block them. */
  studyTimes: string[];
  lang: string;
  t: Dictionary["settings"];
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveLearningSettings, {});
  const [dirty, setDirty] = useState(false);
  const [quietStart, setQuietStart] = useState(initial.quietHoursStart);
  const [quietEnd, setQuietEnd] = useState(initial.quietHoursEnd);
  const [remindBefore, setRemindBefore] = useState(initial.remindBeforeMinutes);
  const warning = quietWarning(quietStart, quietEnd, studyTimes, remindBefore);
  const options = zones.includes(initial.timezone) ? zones : [initial.timezone, ...zones];
  const remindValues = Object.keys(t.remindOptions).map(Number);
  if (!remindValues.includes(initial.remindBeforeMinutes)) remindValues.push(initial.remindBeforeMinutes);

  return (
    <div className="space-y-10">
      <form
        action={(fd) => {
          setDirty(false);
          return action(fd);
        }}
        onChange={() => setDirty(true)}
        className="space-y-6"
      >
        <div>
          <label className={labelCls} htmlFor="st-tz">{t.timezone}</label>
          <select id="st-tz" name="timezone" defaultValue={initial.timezone} className={inputCls}>
            {options.map((z) => (
              <option key={z} value={z}>{z.replaceAll("_", " ")}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">{t.timezoneHint}</p>
        </div>

        <div>
          <label className={labelCls} htmlFor="st-goal">{t.weeklyGoal}</label>
          <input
            id="st-goal"
            name="weeklyGoalMinutes"
            type="number"
            min={10}
            max={5000}
            step={10}
            required
            defaultValue={initial.weeklyGoalMinutes}
            className={`${inputCls} w-40`}
          />
          <p className="mt-1 text-xs text-zinc-500">{t.weeklyGoalHint}</p>
        </div>

        <fieldset className="space-y-4 border-t border-black/5 pt-6 dark:border-white/10">
          <legend className="text-lg font-semibold">🔔 {t.notifications}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pushEnabled"
              defaultChecked={initial.pushEnabled}
              className="size-4 accent-indigo-600"
            />
            {t.pushEnabled}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="followupEnabled"
              defaultChecked={initial.followupEnabled}
              className="size-4 accent-indigo-600"
            />
            {t.followupEnabled}
          </label>

          <div>
            <label className={labelCls} htmlFor="st-before">{t.remindBefore}</label>
            <select
              id="st-before"
              name="remindBeforeMinutes"
              value={remindBefore}
              onChange={(e) => setRemindBefore(Number(e.target.value))}
              className={`${inputCls} w-48`}
            >
              {remindValues.sort((a, b) => a - b).map((m) => (
                <option key={m} value={m}>
                  {(t.remindOptions as Record<string, string>)[String(m)] ?? `${m}′`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelCls}>{t.quietHours}</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="sr-only" htmlFor="st-qs">{t.from}</label>
              <input id="st-qs" name="quietHoursStart" type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className={`${inputCls} w-32`} />
              <span aria-hidden>→</span>
              <label className="sr-only" htmlFor="st-qe">{t.to}</label>
              <input id="st-qe" name="quietHoursEnd" type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className={`${inputCls} w-32`} />
              {(quietStart || quietEnd) && (
                <button
                  type="button"
                  className="text-sm text-indigo-700 hover:underline dark:text-indigo-300"
                  onClick={() => {
                    setQuietStart("");
                    setQuietEnd("");
                    setDirty(true);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{t.quietHoursHint}</p>
            {warning && (
              <p role="alert" className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                ⚠️{" "}
                {warning.kind === "blocks"
                  ? format(t.quietWarnBlocks, { time: warning.time })
                  : format(t.quietWarnLong, { h: warning.hours })}
              </p>
            )}
          </div>
        </fieldset>

        {state.error && <p className="text-sm text-red-600">{state.error === "invalid" ? t.invalid : t.error}</p>}
        {state.ok && !dirty && !pending && <p className="text-sm text-emerald-600">✓ {t.saved}</p>}

        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? t.saving : t.save}
        </button>
      </form>

      <PushDevice lang={lang} t={t} />
    </div>
  );
}

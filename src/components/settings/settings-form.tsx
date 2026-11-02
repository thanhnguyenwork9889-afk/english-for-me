"use client";

import { useActionState, useState } from "react";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import { saveLearningSettings, type SettingsState } from "@/lib/schedule/actions";

export function SettingsForm({
  initial,
  zones,
  t,
}: {
  initial: { timezone: string; weeklyGoalMinutes: number };
  zones: string[];
  t: Dictionary["settings"];
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveLearningSettings, {});
  const [dirty, setDirty] = useState(false);
  const options = zones.includes(initial.timezone) ? zones : [initial.timezone, ...zones];

  return (
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

      <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-white/5 dark:text-zinc-400">🔔 {t.remindersSoon}</p>

      {state.error && <p className="text-sm text-red-600">{state.error === "invalid" ? t.invalid : t.error}</p>}
      {state.ok && !dirty && !pending && <p className="text-sm text-emerald-600">✓ {t.saved}</p>}

      <button type="submit" className={btnPrimary} disabled={pending}>
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}

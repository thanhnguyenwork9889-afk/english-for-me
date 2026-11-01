"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createRoadmap, type CreateRoadmapState } from "@/lib/roadmaps/actions";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";

export function CreateRoadmapForm({
  lang,
  today,
  t,
}: {
  lang: string;
  today: string;
  t: Dictionary["roadmaps"];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateRoadmapState, FormData>(createRoadmap, {});

  if (!open) {
    return (
      <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
        + {t.new}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="w-full space-y-4 rounded-2xl border border-black/5 p-5 dark:border-white/10"
    >
      <input type="hidden" name="lang" value={lang} />
      <div>
        <label className={labelCls} htmlFor="rm-title">{t.form.title}</label>
        <input id="rm-title" name="title" required maxLength={200} autoFocus placeholder={t.form.titlePlaceholder} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="rm-goal">{t.form.goal}</label>
        <input id="rm-goal" name="goal" maxLength={300} placeholder={t.form.goalPlaceholder} className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="rm-start">{t.form.startDate}</label>
          <input id="rm-start" name="startDate" type="date" required defaultValue={today} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="rm-target">{t.form.targetDate}</label>
          <input id="rm-target" name="targetDate" type="date" className={inputCls} />
        </div>
      </div>
      {state.error && (
        <p className="text-sm text-red-600">{state.error === "invalid" ? t.form.invalid : t.form.error}</p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={() => setOpen(false)}>{t.form.cancel}</button>
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? t.form.creating : t.form.create}
        </button>
      </div>
    </form>
  );
}

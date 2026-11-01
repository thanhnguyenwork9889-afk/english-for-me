"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { updateLesson } from "@/lib/roadmaps/actions";
import type { LessonItem } from "@/lib/roadmaps/queries";
import { btnGhost, btnPrimary, inputCls, labelCls, textareaCls } from "@/components/ui";

export function LessonDialog({
  lesson,
  onClose,
  t,
}: {
  lesson: LessonItem;
  onClose: () => void;
  t: Dictionary["roadmaps"];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function submit(formData: FormData) {
    setError(null);
    const resourceUrls = String(formData.get("resourceUrls") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      const res = await updateLesson({
        id: lesson.id,
        title: String(formData.get("title") ?? ""),
        estimatedMinutes: String(formData.get("estimatedMinutes") ?? ""),
        resourceUrls,
        contentMd: String(formData.get("contentMd") ?? ""),
      });
      if (res.ok) onClose();
      else setError(res.error === "invalid" ? t.form.invalid : t.saveError);
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <form action={submit} className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">{t.lesson.editTitle}</h2>
        <div>
          <label className={labelCls} htmlFor="l-title">{t.lesson.title}</label>
          <input id="l-title" name="title" required maxLength={200} defaultValue={lesson.title} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="l-min">{t.lesson.estimatedMinutes}</label>
          <input
            id="l-min"
            name="estimatedMinutes"
            type="number"
            min={1}
            max={1440}
            required
            defaultValue={lesson.estimatedMinutes}
            className={`${inputCls} w-32`}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="l-res">{t.lesson.resources}</label>
          <textarea
            id="l-res"
            name="resourceUrls"
            rows={3}
            defaultValue={lesson.resourceUrls.join("\n")}
            placeholder="https://…"
            className={textareaCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="l-notes">{t.lesson.notes}</label>
          <textarea
            id="l-notes"
            name="contentMd"
            rows={5}
            defaultValue={lesson.contentMd ?? ""}
            placeholder={t.lesson.notesPlaceholder}
            className={textareaCls}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={() => ref.current?.close()}>{t.form.cancel}</button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? t.form.saving : t.form.save}
          </button>
        </div>
      </form>
    </dialog>
  );
}

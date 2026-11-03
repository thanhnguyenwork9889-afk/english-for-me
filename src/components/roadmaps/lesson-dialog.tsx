"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ExerciseRunner } from "@/components/practice/exercise-runner";
import { SpeakButton } from "@/components/speech/speak-button";
import { SpeakingPractice } from "@/components/speech/speaking-practice";
import type { Dictionary } from "@/i18n/get-dictionary";
import { loadLessonPractice } from "@/lib/practice/actions";
import type { PracticeQuestion } from "@/lib/practice/queries";
import { updateLesson } from "@/lib/roadmaps/actions";
import { lessonPhrases } from "@/lib/speech/phrases";
import type { LessonItem } from "@/lib/roadmaps/queries";
import { btnGhost, btnPrimary, inputCls, labelCls, textareaCls } from "@/components/ui";

/** Friendly label for a resource link (YouTube searches show their query). */
function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" && u.pathname === "/results") {
      return `▶ YouTube: ${u.searchParams.get("search_query") ?? ""}`;
    }
    const known: Record<string, string> = {
      "dictionary.cambridge.org": "📖 Cambridge Dictionary",
      "youglish.com": "🔊 YouGlish",
      "learnenglish.britishcouncil.org": "📘 British Council LearnEnglish",
      "bbc.co.uk": "📻 BBC Learning English",
    };
    return known[host] ?? `🔗 ${host}`;
  } catch {
    return url;
  }
}

export function LessonDialog({
  lesson,
  onClose,
  onMarkDone,
  t,
  tv,
  tp,
  tsp,
  markDoneLabel,
}: {
  lesson: LessonItem;
  onClose: () => void;
  /** Open the completion dialog for this lesson (shown in view mode when not completed). */
  onMarkDone?: () => void;
  t: Dictionary["roadmaps"];
  tv: Dictionary["lessonView"];
  tp: Dictionary["practice"];
  tsp: Dictionary["speaking"];
  markDoneLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const hasGuide = Boolean(lesson.contentMd?.trim() || lesson.resourceUrls.length);
  const [mode, setMode] = useState<"view" | "edit" | "practice" | "speak">(hasGuide ? "view" : "edit");
  const phrases = lessonPhrases(lesson.contentMd);
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function startPractice() {
    setError(null);
    startTransition(async () => {
      const list = await loadLessonPractice(lesson.id);
      if (list.length === 0) {
        setError(tp.none);
        return;
      }
      setQuestions(list);
      setMode("practice");
    });
  }

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
      if (res.ok) ref.current?.close();
      else setError(res.error === "invalid" ? t.form.invalid : t.saveError);
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] rounded-2xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      {mode === "practice" ? (
        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold">{tp.title}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">{lesson.title}</p>
          </div>
          <ExerciseRunner
            questions={questions ?? []}
            t={tp}
            closeLabel={tv.close}
            onClose={() => ref.current?.close()}
          />
        </div>
      ) : mode === "speak" ? (
        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold">{tsp.title}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">{lesson.title}</p>
          </div>
          <SpeakingPractice
            phrases={phrases}
            t={tsp}
            closeLabel={tv.close}
            onClose={() => setMode("view")}
          />
        </div>
      ) : mode === "view" ? (
        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold">{lesson.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              ⏱️ {lesson.estimatedMinutes} {t.minutes}
              {lesson.completed && <span className="ml-2 font-medium text-emerald-600">✓</span>}
            </p>
          </div>

          {lesson.contentMd?.trim() ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{tv.goal}</h3>
              <div className="rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed whitespace-pre-wrap dark:bg-white/5">
                {lesson.contentMd}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">{tv.noContent}</p>
          )}

          {phrases.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{tsp.phrases}</h3>
              <ul className="space-y-1">
                {phrases.map((phrase) => (
                  <li key={phrase} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm">{phrase}</span>
                    <SpeakButton text={phrase} label={tsp.listen} slowLabel={tsp.listenSlow} />
                  </li>
                ))}
              </ul>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setMode("speak")}>
                🎤 {tsp.start}
              </button>
              <p className="mt-2 text-xs text-zinc-500">{tsp.hint}</p>
            </div>
          )}

          {lesson.resourceUrls.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{tv.resources}</h3>
              <ul className="space-y-1.5">
                {lesson.resourceUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                    >
                      {linkLabel(url)} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.exerciseCount > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <p className="text-sm font-semibold">
                📝 {tp.title} · {lesson.practiceCorrect}/{lesson.exerciseCount}
              </p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{tp.lessonHint}</p>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={startPractice} disabled={pending}>
                {pending ? tp.loading : lesson.practiceCorrect > 0 ? tp.again : tp.start}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" className={btnGhost} onClick={() => setMode("edit")}>
              ✏️ {tv.edit}
            </button>
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => ref.current?.close()}>
                {tv.close}
              </button>
              {!lesson.completed && onMarkDone && (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    ref.current?.close();
                    onMarkDone();
                  }}
                >
                  ✓ {markDoneLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
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
              rows={8}
              defaultValue={lesson.contentMd ?? ""}
              placeholder={t.lesson.notesPlaceholder}
              className={textareaCls}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={() => (hasGuide ? setMode("view") : ref.current?.close())}
            >
              {t.form.cancel}
            </button>
            <button type="submit" className={btnPrimary} disabled={pending}>
              {pending ? t.form.saving : t.form.save}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

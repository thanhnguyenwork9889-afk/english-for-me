"use client";

import { useState, useTransition } from "react";
import { ProgressMeter } from "@/components/progress/progress-meter";
import { btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { answerExercise, practiceFinished } from "@/lib/practice/actions";
import { scoreBand } from "@/lib/practice/grade";
import type { PracticeQuestion } from "@/lib/practice/queries";

/** A question plus, in review mode, the lesson it came from. */
export type RunnerQuestion = PracticeQuestion & { lessonTitle?: string };

type Feedback = { correct: boolean; answer: string; explanation: string | null };

/**
 * Runs a list of questions one at a time: answer → immediate feedback → next → summary.
 * Grading happens in a server action, so the answers are never in the page source.
 */
export function ExerciseRunner({
  questions,
  t,
  onClose,
  closeLabel,
}: {
  questions: RunnerQuestion[];
  t: Dictionary["practice"];
  /** Called when the user leaves the summary (the page is refreshed first). */
  onClose?: () => void;
  closeLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const question = questions[index];
  const done = index >= questions.length;
  const correctCount = results.filter(Boolean).length;

  function submit(answer: string) {
    if (!answer.trim() || pending) return;
    setError(null);
    setChosen(answer);
    startTransition(async () => {
      const res = await answerExercise({ exerciseId: question.id, answer });
      if (!res.ok) {
        setError(t.error);
        return;
      }
      setFeedback({ correct: res.correct, answer: res.answer, explanation: res.explanation });
      setResults((r) => [...r, res.correct]);
    });
  }

  function next() {
    setFeedback(null);
    setChosen(null);
    setTyped("");
    setIndex((i) => i + 1);
  }

  function finish() {
    startTransition(async () => {
      await practiceFinished();
      onClose?.();
    });
  }

  if (done) {
    const band = scoreBand(correctCount, questions.length);
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl" aria-hidden>
          {band === "perfect" ? "🎉" : band === "good" ? "👍" : "💪"}
        </p>
        <p className="text-lg font-semibold">
          {format(t.score, { correct: correctCount, total: questions.length })}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.bands[band]}</p>
        {correctCount < questions.length && <p className="text-sm text-zinc-500">{t.wrongQueued}</p>}
        <button type="button" className={btnPrimary} onClick={finish} disabled={pending}>
          {pending ? t.saving : closeLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm text-zinc-500">
          <span>{format(t.questionOf, { n: index + 1, total: questions.length })}</span>
          {question.lessonTitle && <span className="truncate text-right">{question.lessonTitle}</span>}
        </div>
        <ProgressMeter
          value={index}
          max={questions.length}
          label={format(t.questionOf, { n: index + 1, total: questions.length })}
          size="sm"
        />
      </div>

      <p className="text-base font-medium whitespace-pre-wrap">{question.prompt}</p>

      {question.kind === "mcq" ? (
        <ul className="space-y-2">
          {(question.options ?? []).map((option) => {
            // After answering, mark the right option and — if different — the one picked.
            const isAnswer = Boolean(feedback) && option === feedback?.answer;
            const isMistake = Boolean(feedback) && option === chosen && !isAnswer;
            return (
              <li key={option}>
                <button
                  type="button"
                  disabled={Boolean(feedback) || pending}
                  onClick={() => submit(option)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${
                    isAnswer
                      ? "border-emerald-500 bg-emerald-50 font-medium dark:bg-emerald-500/10"
                      : isMistake
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        : "border-black/10 hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-white/15 dark:hover:bg-indigo-500/10"
                  }`}
                >
                  {isAnswer && <span aria-hidden>✅ </span>}
                  {isMistake && <span aria-hidden>❌ </span>}
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(typed);
          }}
          className="flex gap-2"
        >
          <label className="sr-only" htmlFor="practice-answer">
            {t.yourAnswer}
          </label>
          <input
            id="practice-answer"
            // Typing English: the browser's autocorrect would answer the question for them.
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={200}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={Boolean(feedback) || pending}
            placeholder={t.yourAnswer}
            className={inputCls}
          />
          {!feedback && (
            <button type="submit" className={btnPrimary} disabled={pending || !typed.trim()}>
              {pending ? "…" : t.check}
            </button>
          )}
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-4 text-sm ${
            feedback.correct
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          }`}
        >
          <p className="font-semibold">
            <span aria-hidden>{feedback.correct ? "✅" : "❌"}</span>{" "}
            {feedback.correct ? t.right : t.wrong}
          </p>
          {!feedback.correct && (
            <p className="mt-1">
              {t.answerIs} <strong>{feedback.answer}</strong>
            </p>
          )}
          {feedback.explanation && <p className="mt-1 text-zinc-700 dark:text-zinc-300">💡 {feedback.explanation}</p>}
          <button type="button" className={`${btnPrimary} mt-3`} onClick={next} autoFocus>
            {index + 1 < questions.length ? t.next : t.seeResult}
          </button>
        </div>
      )}

      {!feedback && onClose && (
        <button type="button" className={btnGhost} onClick={finish} disabled={pending}>
          {t.quit}
        </button>
      )}
    </div>
  );
}

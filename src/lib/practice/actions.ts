"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { exerciseAttempts, exercises, lessons, phases, reviewItems, roadmaps } from "@/db/schema";
import { requireUserIdForAction } from "@/lib/auth";
import { getLessonQuestions, getReviewQueue, type PracticeQuestion, type ReviewQuestion } from "./queries";
import { acceptedAnswers, isCorrect, nextReview } from "./grade";

export type Graded =
  | {
      ok: true;
      correct: boolean;
      /** The right answer, revealed only after the user has answered. */
      answer: string;
      explanation: string | null;
    }
  | { ok: false; error: "invalid" | "notFound" | "server" };

const answerSchema = z.object({
  exerciseId: z.uuid(),
  answer: z.string().trim().min(1).max(500),
});

/**
 * Grade one answer. The correct answer lives only on the server, so a question can't be
 * peeked at in the page source — it comes back in the response, after the answer is in.
 */
export async function answerExercise(input: z.input<typeof answerSchema>): Promise<Graded> {
  const userId = await requireUserIdForAction();
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { exerciseId, answer } = parsed.data;

  try {
    // Ownership and the answer in one query: an exercise is the user's if its roadmap is.
    const [row] = await db
      .select({ answer: exercises.answer, explanation: exercises.explanation })
      .from(exercises)
      .innerJoin(lessons, eq(lessons.id, exercises.lessonId))
      .innerJoin(phases, eq(phases.id, lessons.phaseId))
      .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
      .where(and(eq(exercises.id, exerciseId), eq(roadmaps.userId, userId)));
    if (!row) return { ok: false, error: "notFound" };

    const correct = isCorrect(answer, row.answer);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(exerciseAttempts).values({ userId, exerciseId, answer, correct });

      if (!correct) {
        // Wrong: (re)queue it for review, counting how often it has tripped the user up.
        await tx
          .insert(reviewItems)
          .values({ userId, exerciseId, box: 0, dueAt: now, wrongCount: 1, updatedAt: now })
          .onConflictDoUpdate({
            target: [reviewItems.userId, reviewItems.exerciseId],
            set: {
              box: 0,
              dueAt: now,
              wrongCount: sql`${reviewItems.wrongCount} + 1`,
              updatedAt: now,
            },
          });
        return;
      }

      // Right: only questions already in the queue move — a first-time correct answer
      // never creates one.
      const where = and(eq(reviewItems.userId, userId), eq(reviewItems.exerciseId, exerciseId));
      const [item] = await tx.select({ box: reviewItems.box }).from(reviewItems).where(where);
      if (!item) return;

      const next = nextReview(item.box, true, now);
      if (next === "graduated") await tx.delete(reviewItems).where(where);
      else await tx.update(reviewItems).set({ box: next.box, dueAt: next.dueAt, updatedAt: now }).where(where);
    });

    // A fill question may accept several wordings; show the first as "the" answer.
    return { ok: true, correct, answer: acceptedAnswers(row.answer)[0] ?? row.answer, explanation: row.explanation };
  } catch (e) {
    console.error("[answerExercise]", e);
    return { ok: false, error: "server" };
  }
}

/** Questions for a lesson's practice run (empty if the lesson has none yet). */
export async function loadLessonPractice(lessonId: string): Promise<PracticeQuestion[]> {
  const userId = await requireUserIdForAction();
  if (!z.uuid().safeParse(lessonId).success) return [];
  return getLessonQuestions(userId, lessonId);
}

/** A batch of due review questions. */
export async function loadReviewBatch(limit = 10): Promise<ReviewQuestion[]> {
  const userId = await requireUserIdForAction();
  return getReviewQueue(userId, Math.min(Math.max(1, limit), 30));
}

/** Re-render the page once a practice run is over, so badges and due counts catch up. */
export async function practiceFinished(): Promise<void> {
  await requireUserIdForAction();
  refresh();
}

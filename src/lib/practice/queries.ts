import "server-only";
import { cache } from "react";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { exerciseAttempts, exercises, lessons, phases, reviewItems, roadmaps } from "@/db/schema";

/** A question as the client sees it: never the answer, which only the server grades. */
export type PracticeQuestion = {
  id: string;
  kind: "mcq" | "fill";
  prompt: string;
  options: string[] | null;
};

const questionColumns = {
  id: exercises.id,
  kind: sql<"mcq" | "fill">`${exercises.kind}`,
  prompt: exercises.prompt,
  options: exercises.options,
};

/** The lesson's questions, in order. Empty when the user doesn't own the lesson. */
export async function getLessonQuestions(userId: string, lessonId: string): Promise<PracticeQuestion[]> {
  return db
    .select(questionColumns)
    .from(exercises)
    .innerJoin(lessons, eq(lessons.id, exercises.lessonId))
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
    .where(and(eq(exercises.lessonId, lessonId), eq(roadmaps.userId, userId)))
    .orderBy(asc(exercises.orderIndex));
}

export type ReviewQuestion = PracticeQuestion & {
  lessonId: string;
  lessonTitle: string;
  roadmapId: string;
  /** How many times this question has been answered wrong — the reason it's in the queue. */
  wrongCount: number;
};

/** Questions the user got wrong and that are due again, oldest due first. */
export async function getReviewQueue(userId: string, limit = 10): Promise<ReviewQuestion[]> {
  return db
    .select({
      ...questionColumns,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      roadmapId: phases.roadmapId,
      wrongCount: reviewItems.wrongCount,
    })
    .from(reviewItems)
    .innerJoin(exercises, eq(exercises.id, reviewItems.exerciseId))
    .innerJoin(lessons, eq(lessons.id, exercises.lessonId))
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .where(and(eq(reviewItems.userId, userId), sql`${reviewItems.dueAt} <= now()`))
    .orderBy(asc(reviewItems.dueAt))
    .limit(limit);
}

export type ReviewCounts = { due: number; later: number };

/** For the dashboard card: how much is waiting now, and how much is scheduled for later. */
export const getReviewCounts = cache(async (userId: string): Promise<ReviewCounts> => {
  const [row] = await db
    .select({
      due: sql<number>`count(*) filter (where ${reviewItems.dueAt} <= now())::int`,
      later: sql<number>`count(*) filter (where ${reviewItems.dueAt} > now())::int`,
    })
    .from(reviewItems)
    .where(eq(reviewItems.userId, userId));
  return { due: row?.due ?? 0, later: row?.later ?? 0 };
});

export type LessonPractice = { total: number; correct: number };

/**
 * Per-lesson practice tally for one roadmap, for the badges on the board. A question
 * counts as `correct` once it has ever been answered right.
 */
export async function getRoadmapPractice(userId: string, roadmapId: string): Promise<Map<string, LessonPractice>> {
  const rows = await db
    .select({
      lessonId: lessons.id,
      total: sql<number>`count(distinct ${exercises.id})::int`,
      correct: sql<number>`count(distinct ${exerciseAttempts.exerciseId}) filter (where ${exerciseAttempts.correct})::int`,
    })
    .from(lessons)
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
    .innerJoin(exercises, eq(exercises.lessonId, lessons.id))
    .leftJoin(
      exerciseAttempts,
      and(eq(exerciseAttempts.exerciseId, exercises.id), eq(exerciseAttempts.userId, userId)),
    )
    .where(and(eq(phases.roadmapId, roadmapId), eq(roadmaps.userId, userId)))
    .groupBy(lessons.id);
  return new Map(rows.map((r) => [r.lessonId, { total: r.total, correct: r.correct }]));
}

"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { requireUserIdForAction } from "@/lib/auth";
import { ownedLessonRoadmap } from "@/lib/roadmaps/queries";

export type ProgressResult = { ok: true } | { ok: false; error: "invalid" | "notFound" | "server" };

const completeSchema = z.object({
  lessonId: z.uuid(),
  difficulty: z.number().int().min(1).max(5).nullable(),
  actualMinutes: z.number().int().min(1).max(1440).nullable(),
  note: z.string().trim().max(2000).transform((v) => v || null),
});

/** Mark a lesson as completed (upsert). Re-completing updates the details but keeps the original date. */
export async function completeLesson(input: z.input<typeof completeSchema>): Promise<ProgressResult> {
  const userId = await requireUserIdForAction();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { lessonId, ...details } = parsed.data;
  if (!(await ownedLessonRoadmap(userId, lessonId))) return { ok: false, error: "notFound" };

  try {
    const now = new Date();
    const [existing] = await db
      .select({ status: lessonProgress.status, completedAt: lessonProgress.completedAt })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    const completedAt = existing?.status === "completed" && existing.completedAt ? existing.completedAt : now;

    await db
      .insert(lessonProgress)
      .values({ userId, lessonId, status: "completed", completedAt, ...details })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { status: "completed", completedAt, ...details },
      });
  } catch (e) {
    console.error("[completeLesson]", e);
    return { ok: false, error: "server" };
  }
  refresh();
  return { ok: true };
}

/** Reopen a completed lesson. Keeps the note/difficulty in case it's completed again. */
export async function reopenLesson(lessonId: string): Promise<ProgressResult> {
  const userId = await requireUserIdForAction();
  if (!z.uuid().safeParse(lessonId).success) return { ok: false, error: "invalid" };
  if (!(await ownedLessonRoadmap(userId, lessonId))) return { ok: false, error: "notFound" };

  try {
    await db
      .update(lessonProgress)
      .set({ status: "not_started", completedAt: null })
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
  } catch (e) {
    console.error("[reopenLesson]", e);
    return { ok: false, error: "server" };
  }
  refresh();
  return { ok: true };
}

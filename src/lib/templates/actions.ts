"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { exercises, lessons, phases, roadmaps } from "@/db/schema";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { requireUserIdForAction } from "@/lib/auth";
import { getUserPrefs } from "@/lib/progress/queries";
import { addDays, todayIn } from "@/lib/progress/streak";
import { ownsRoadmap } from "@/lib/roadmaps/queries";
import { buildExercise } from "./build";
import { exercisesForTitle, getTemplate } from "./index";

export type TemplateState = { error?: "notFound" | "server" };

export type SeedResult = { ok: true; added: number } | { ok: false; error: "notFound" | "server" };

/**
 * Attach the template's practice questions to a roadmap that was created before those
 * questions existed, matching lessons by title. Idempotent: the unique (lesson, order)
 * constraint means re-running adds nothing, and lessons the user wrote themselves are
 * left alone.
 */
export async function seedExercisesForRoadmap(roadmapId: string): Promise<SeedResult> {
  const userId = await requireUserIdForAction();
  if (!z.uuid().safeParse(roadmapId).success) return { ok: false, error: "notFound" };
  if (!(await ownsRoadmap(userId, roadmapId))) return { ok: false, error: "notFound" };

  try {
    const rows = await db
      .select({ id: lessons.id, title: lessons.title })
      .from(lessons)
      .innerJoin(phases, eq(phases.id, lessons.phaseId))
      .where(eq(phases.roadmapId, roadmapId));

    const values = rows.flatMap((l) =>
      exercisesForTitle(l.title).map((e, i) => ({ lessonId: l.id, ...buildExercise(e, i) })),
    );
    if (values.length === 0) return { ok: true, added: 0 };

    const inserted = await db
      .insert(exercises)
      .values(values)
      .onConflictDoNothing({ target: [exercises.lessonId, exercises.orderIndex] })
      .returning({ id: exercises.id });
    refresh();
    return { ok: true, added: inserted.length };
  } catch (e) {
    console.error("[seedExercisesForRoadmap]", e);
    return { ok: false, error: "server" };
  }
}

/** Copy a template into a new roadmap owned by the user, starting today, then open it. */
export async function createRoadmapFromTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const userId = await requireUserIdForAction();
  const rawLang = String(formData.get("lang") ?? "");
  const lang = hasLocale(rawLang) ? rawLang : defaultLocale;
  const template = getTemplate(String(formData.get("templateId") ?? ""));
  if (!template) return { error: "notFound" };

  const { timezone } = await getUserPrefs(userId);
  const startDate = todayIn(timezone);
  const weeksPerPhase = template.weeks / template.phases.length;

  let id: string;
  try {
    id = await db.transaction(async (tx) => {
      const [rm] = await tx
        .insert(roadmaps)
        .values({
          userId,
          title: template.title,
          goal: template.goal,
          startDate,
          targetDate: addDays(startDate, template.weeks * 7 - 1),
        })
        .returning({ id: roadmaps.id });

      const phaseRows = await tx
        .insert(phases)
        .values(
          template.phases.map((p, i) => ({
            roadmapId: rm.id,
            title: p.title,
            orderIndex: i,
            targetDate: addDays(startDate, Math.round((i + 1) * weeksPerPhase * 7) - 1),
          })),
        )
        .returning({ id: phases.id, orderIndex: phases.orderIndex });

      const phaseIdByIndex = new Map(phaseRows.map((p) => [p.orderIndex, p.id]));
      const lessonRows = await tx
        .insert(lessons)
        .values(
          template.phases.flatMap((p, pi) =>
            p.lessons.map((l, li) => ({
              phaseId: phaseIdByIndex.get(pi)!,
              title: l.title,
              estimatedMinutes: l.estimatedMinutes,
              contentMd: l.contentMd,
              resourceUrls: l.resourceUrls,
              orderIndex: li,
            })),
          ),
        )
        .returning({ id: lessons.id, phaseId: lessons.phaseId, orderIndex: lessons.orderIndex });

      // Match the inserted lessons back to the template by (phase, order) to attach questions.
      const lessonIdAt = new Map(lessonRows.map((l) => [`${l.phaseId}:${l.orderIndex}`, l.id]));
      const exerciseRows = template.phases.flatMap((p, pi) =>
        p.lessons.flatMap((l, li) => {
          const lessonId = lessonIdAt.get(`${phaseIdByIndex.get(pi)}:${li}`);
          return lessonId ? l.exercises.map((e) => ({ lessonId, ...e })) : [];
        }),
      );
      if (exerciseRows.length > 0) await tx.insert(exercises).values(exerciseRows);

      return rm.id;
    });
  } catch (e) {
    console.error("[createRoadmapFromTemplate]", e);
    return { error: "server" };
  }
  redirect(`/${lang}/roadmaps/${id}`);
}

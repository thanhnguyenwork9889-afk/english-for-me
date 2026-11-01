"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { lessons, phases, roadmaps } from "@/db/schema";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { requireUserIdForAction } from "@/lib/auth";
import { ownedLessonRoadmap, ownedPhaseRoadmap, ownsRoadmap } from "./queries";

export type ActionResult = { ok: true } | { ok: false; error: "invalid" | "notFound" | "server" };

const uuid = z.uuid();
const title = z.string().trim().min(1).max(200);
const isoDate = z.iso.date();
const optionalDate = z.union([isoDate, z.literal("")]).transform((v) => v || null);
const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);

const fail = (error: "invalid" | "notFound" | "server"): ActionResult => ({ ok: false, error });

// ---------- Roadmap ----------

const roadmapFields = z.object({
  title,
  goal: optionalText(300),
  startDate: isoDate,
  targetDate: optionalDate,
});

export type CreateRoadmapState = { error?: "invalid" | "server" };

export async function createRoadmap(_prev: CreateRoadmapState, formData: FormData): Promise<CreateRoadmapState> {
  const userId = await requireUserIdForAction();
  const rawLang = String(formData.get("lang") ?? "");
  const lang = hasLocale(rawLang) ? rawLang : defaultLocale;

  const parsed = roadmapFields.safeParse({
    title: formData.get("title"),
    goal: formData.get("goal") ?? "",
    startDate: formData.get("startDate"),
    targetDate: formData.get("targetDate") ?? "",
  });
  if (!parsed.success) return { error: "invalid" };
  const { targetDate, startDate } = parsed.data;
  if (targetDate && targetDate < startDate) return { error: "invalid" };

  let id: string;
  try {
    const [row] = await db
      .insert(roadmaps)
      .values({ userId, ...parsed.data })
      .returning({ id: roadmaps.id });
    id = row.id;
  } catch (e) {
    console.error("[createRoadmap]", e);
    return { error: "server" };
  }
  redirect(`/${lang}/roadmaps/${id}`);
}

export async function updateRoadmap(input: {
  id: string;
  title: string;
  goal: string;
  startDate: string;
  targetDate: string;
}): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = roadmapFields.extend({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { id, ...fields } = parsed.data;
  if (fields.targetDate && fields.targetDate < fields.startDate) return fail("invalid");

  const res = await db
    .update(roadmaps)
    .set(fields)
    .where(and(eq(roadmaps.id, id), eq(roadmaps.userId, userId)))
    .returning({ id: roadmaps.id });
  if (!res.length) return fail("notFound");
  refresh();
  return { ok: true };
}

export async function deleteRoadmap(id: string, lang: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  if (!uuid.safeParse(id).success) return fail("invalid");
  const res = await db
    .delete(roadmaps)
    .where(and(eq(roadmaps.id, id), eq(roadmaps.userId, userId)))
    .returning({ id: roadmaps.id });
  if (!res.length) return fail("notFound");
  redirect(`/${hasLocale(lang) ? lang : defaultLocale}/roadmaps`);
}

// ---------- Phase ----------

export async function createPhase(roadmapId: string, phaseTitle: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = z.object({ roadmapId: uuid, title }).safeParse({ roadmapId, title: phaseTitle });
  if (!parsed.success) return fail("invalid");
  if (!(await ownsRoadmap(userId, roadmapId))) return fail("notFound");

  await db.insert(phases).values({
    roadmapId,
    title: parsed.data.title,
    orderIndex: sql`(select coalesce(max(${phases.orderIndex}), -1) + 1 from ${phases} where ${phases.roadmapId} = ${roadmapId})`,
  });
  refresh();
  return { ok: true };
}

export async function renamePhase(phaseId: string, phaseTitle: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = z.object({ phaseId: uuid, title }).safeParse({ phaseId, title: phaseTitle });
  if (!parsed.success) return fail("invalid");
  if (!(await ownedPhaseRoadmap(userId, phaseId))) return fail("notFound");

  await db.update(phases).set({ title: parsed.data.title }).where(eq(phases.id, phaseId));
  refresh();
  return { ok: true };
}

export async function deletePhase(phaseId: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  if (!uuid.safeParse(phaseId).success) return fail("invalid");
  if (!(await ownedPhaseRoadmap(userId, phaseId))) return fail("notFound");

  await db.delete(phases).where(eq(phases.id, phaseId));
  refresh();
  return { ok: true };
}

// ---------- Lesson ----------

export async function createLesson(phaseId: string, lessonTitle: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = z.object({ phaseId: uuid, title }).safeParse({ phaseId, title: lessonTitle });
  if (!parsed.success) return fail("invalid");
  if (!(await ownedPhaseRoadmap(userId, phaseId))) return fail("notFound");

  await db.insert(lessons).values({
    phaseId,
    title: parsed.data.title,
    orderIndex: sql`(select coalesce(max(${lessons.orderIndex}), -1) + 1 from ${lessons} where ${lessons.phaseId} = ${phaseId})`,
  });
  refresh();
  return { ok: true };
}

const lessonFields = z.object({
  id: uuid,
  title,
  estimatedMinutes: z.coerce.number().int().min(1).max(1440),
  resourceUrls: z.array(z.url({ protocol: /^https?$/ })).max(20),
  contentMd: optionalText(20_000),
});

export async function updateLesson(input: {
  id: string;
  title: string;
  estimatedMinutes: number | string;
  resourceUrls: string[];
  contentMd: string;
}): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = lessonFields.safeParse(input);
  if (!parsed.success) return fail("invalid");
  if (!(await ownedLessonRoadmap(userId, parsed.data.id))) return fail("notFound");

  const { id, ...fields } = parsed.data;
  await db.update(lessons).set(fields).where(eq(lessons.id, id));
  refresh();
  return { ok: true };
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  if (!uuid.safeParse(lessonId).success) return fail("invalid");
  if (!(await ownedLessonRoadmap(userId, lessonId))) return fail("notFound");

  await db.delete(lessons).where(eq(lessons.id, lessonId));
  refresh();
  return { ok: true };
}

// ---------- Reorder (drag & drop) ----------

const reorderSchema = z.object({
  roadmapId: uuid,
  phases: z.array(z.object({ id: uuid, lessonIds: z.array(uuid) })).max(200),
});

/** Persist the full order of phases and lessons (lessons may move between phases). */
export async function reorderRoadmap(input: z.input<typeof reorderSchema>): Promise<ActionResult> {
  const userId = await requireUserIdForAction();
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { roadmapId, phases: order } = parsed.data;
  if (!(await ownsRoadmap(userId, roadmapId))) return fail("notFound");

  // Every phase and lesson in the payload must belong to this roadmap, and none may be missing.
  const phaseIds = order.map((p) => p.id);
  const lessonIds = order.flatMap((p) => p.lessonIds);
  const ownedPhases = await db
    .select({ id: phases.id })
    .from(phases)
    .where(eq(phases.roadmapId, roadmapId));
  const ownedLessons = ownedPhases.length
    ? await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(inArray(lessons.phaseId, ownedPhases.map((p) => p.id)))
    : [];
  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));
  if (!sameSet(phaseIds, ownedPhases.map((p) => p.id)) || !sameSet(lessonIds, ownedLessons.map((l) => l.id))) {
    return fail("invalid");
  }

  try {
    await db.transaction(async (tx) => {
      for (const [pi, phase] of order.entries()) {
        await tx.update(phases).set({ orderIndex: pi }).where(eq(phases.id, phase.id));
        for (const [li, lessonId] of phase.lessonIds.entries()) {
          await tx
            .update(lessons)
            .set({ phaseId: phase.id, orderIndex: li })
            .where(eq(lessons.id, lessonId));
        }
      }
    });
  } catch (e) {
    console.error("[reorderRoadmap]", e);
    return fail("server");
  }
  refresh();
  return { ok: true };
}

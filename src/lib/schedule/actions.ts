"use server";

import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { studySchedules, studySessions, userSettings } from "@/db/schema";
import { requireUserIdForAction } from "@/lib/auth";
import { ownsRoadmap } from "@/lib/roadmaps/queries";
import { isValidTimeZone } from "./occurrences";

export type ScheduleResult = { ok: true } | { ok: false; error: "invalid" | "notFound" | "server" };

const scheduleSchema = z.object({
  roadmapId: z.uuid(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).max(7),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMin: z.number().int().min(5).max(480),
  active: z.boolean(),
});

/** One schedule per roadmap: create or replace it. */
export async function saveSchedule(input: z.input<typeof scheduleSchema>): Promise<ScheduleResult> {
  const userId = await requireUserIdForAction();
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { roadmapId, ...rest } = parsed.data;
  const daysOfWeek = [...new Set(rest.daysOfWeek)].sort();
  if (rest.active && daysOfWeek.length === 0) return { ok: false, error: "invalid" };
  if (!(await ownsRoadmap(userId, roadmapId))) return { ok: false, error: "notFound" };

  try {
    await db.transaction(async (tx) => {
      const where = and(eq(studySchedules.userId, userId), eq(studySchedules.roadmapId, roadmapId));
      const [existing] = await tx.select({ id: studySchedules.id }).from(studySchedules).where(where).limit(1);
      const values = { ...rest, daysOfWeek, startTime: `${rest.startTime}:00` };
      let scheduleId = existing?.id;
      if (scheduleId) await tx.update(studySchedules).set(values).where(eq(studySchedules.id, scheduleId));
      else
        [{ id: scheduleId }] = await tx
          .insert(studySchedules)
          .values({ userId, roadmapId, ...values })
          .returning({ id: studySchedules.id });
      // Drop future, not-yet-reminded sessions made from the old rule; the cron re-creates them.
      await tx
        .delete(studySessions)
        .where(
          and(
            eq(studySessions.scheduleId, scheduleId!),
            eq(studySessions.status, "upcoming"),
            isNull(studySessions.remindedAt),
            gt(studySessions.scheduledAt, sql`now()`),
          ),
        );
    });
  } catch (e) {
    console.error("[saveSchedule]", e);
    return { ok: false, error: "server" };
  }
  refresh();
  return { ok: true };
}

const hhmm = z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")]);

const settingsSchema = z.object({
  timezone: z.string().max(64).refine(isValidTimeZone),
  weeklyGoalMinutes: z.number().int().min(10).max(5000),
  pushEnabled: z.boolean(),
  remindBeforeMinutes: z.number().int().min(0).max(240),
  quietHoursStart: hhmm,
  quietHoursEnd: hhmm,
});

export type SettingsState = { ok?: boolean; error?: "invalid" | "server" };

export async function saveLearningSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const userId = await requireUserIdForAction();
  const parsed = settingsSchema.safeParse({
    timezone: formData.get("timezone"),
    weeklyGoalMinutes: Number(formData.get("weeklyGoalMinutes")),
    pushEnabled: formData.get("pushEnabled") === "on",
    remindBeforeMinutes: Number(formData.get("remindBeforeMinutes")),
    quietHoursStart: formData.get("quietHoursStart") ?? "",
    quietHoursEnd: formData.get("quietHoursEnd") ?? "",
  });
  if (!parsed.success) return { error: "invalid" };
  const { quietHoursStart, quietHoursEnd, ...rest } = parsed.data;
  // Quiet hours need both ends; otherwise turn them off.
  const quiet =
    quietHoursStart && quietHoursEnd
      ? { quietHoursStart: `${quietHoursStart}:00`, quietHoursEnd: `${quietHoursEnd}:00` }
      : { quietHoursStart: null, quietHoursEnd: null };
  const values = { ...rest, ...quiet };

  try {
    await db
      .insert(userSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: userSettings.userId, set: values });
  } catch (e) {
    console.error("[saveLearningSettings]", e);
    return { error: "server" };
  }
  refresh();
  return { ok: true };
}

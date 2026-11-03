import "server-only";
import { cache } from "react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { roadmaps, studySchedules, studySessions } from "@/db/schema";
import { getReviewCounts } from "@/lib/practice/queries";
import { getUserPrefs } from "@/lib/progress/queries";
import { addDays, computeStreak, todayIn, weekStart } from "@/lib/progress/streak";
import { daysBetween, nowIn, projectFinishDate } from "@/lib/schedule/occurrences";
import { remainingLessons } from "@/lib/schedule/queries";
import { getActivityDays, getAttendance } from "@/lib/stats/queries";
import type { Facts, RoadmapOutlook, WeekTotals } from "./rules";

/** Totals for the ISO week starting on `monday`, from the per-day activity rows. */
function weekTotals(days: { date: string; lessons: number; minutes: number }[], monday: string): WeekTotals {
  const end = addDays(monday, 7); // exclusive
  return days
    .filter((d) => d.date >= monday && d.date < end)
    .reduce((sum, d) => ({ minutes: sum.minutes + d.minutes, lessons: sum.lessons + d.lessons }), {
      minutes: 0,
      lessons: 0,
    });
}

/**
 * How many of the most recent finished sessions were missed, counting back from the
 * latest. A run of these usually means the chosen study time doesn't fit the user's day.
 */
async function missedInARow(userId: string): Promise<number> {
  const rows = await db
    .select({ status: studySessions.status })
    .from(studySessions)
    .where(and(eq(studySessions.userId, userId), inArray(studySessions.status, ["done", "missed"])))
    .orderBy(desc(studySessions.scheduledAt))
    .limit(30);

  let run = 0;
  for (const row of rows) {
    if (row.status !== "missed") break;
    run++;
  }
  return run;
}

/** Projected finish versus the deadline, per active roadmap. */
async function roadmapOutlooks(userId: string, timezone: string): Promise<RoadmapOutlook[]> {
  const rows = await db
    .select({
      roadmapId: roadmaps.id,
      title: roadmaps.title,
      targetDate: roadmaps.targetDate,
      scheduleId: studySchedules.id,
      daysOfWeek: studySchedules.daysOfWeek,
      startTime: studySchedules.startTime,
      durationMin: studySchedules.durationMin,
      active: studySchedules.active,
    })
    .from(roadmaps)
    .leftJoin(
      studySchedules,
      and(eq(studySchedules.roadmapId, roadmaps.id), eq(studySchedules.userId, userId)),
    )
    .where(and(eq(roadmaps.userId, userId), eq(roadmaps.status, "active")))
    .orderBy(desc(roadmaps.createdAt));

  const now = nowIn(timezone);
  return Promise.all(
    rows.map(async (row) => {
      const left = await remainingLessons(userId, row.roadmapId);
      const rule = row.daysOfWeek && row.startTime && row.active
        ? { daysOfWeek: row.daysOfWeek, startTime: row.startTime, durationMin: row.durationMin ?? 30 }
        : null;
      return {
        roadmapId: row.roadmapId,
        title: row.title,
        targetDate: row.targetDate,
        remainingLessons: left.length,
        remainingMinutes: left.reduce((s, l) => s + l.estimatedMinutes, 0),
        finishDate: rule ? projectFinishDate(rule, left, now) : null,
      };
    }),
  );
}

/** Whether the user has at least one active schedule on an active roadmap. */
async function hasActiveSchedule(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(studySchedules)
    .innerJoin(roadmaps, eq(roadmaps.id, studySchedules.roadmapId))
    .where(
      and(eq(studySchedules.userId, userId), eq(studySchedules.active, true), eq(roadmaps.status, "active")),
    );
  return (row?.n ?? 0) > 0;
}

/** Everything the supervisor rules need, in one place. */
export const getSupervisorFacts = cache(async (userId: string): Promise<Facts> => {
  const { timezone, weeklyGoalMinutes } = await getUserPrefs(userId);
  const today = todayIn(timezone);

  const [days, attendance, review, missedRun, outlooks, hasSchedule] = await Promise.all([
    getActivityDays(userId, timezone),
    getAttendance(userId),
    getReviewCounts(userId),
    missedInARow(userId),
    roadmapOutlooks(userId, timezone),
    hasActiveSchedule(userId),
  ]);

  const monday = weekStart(today);
  const lastStudied = days.at(-1)?.date ?? null;

  return {
    today,
    weeklyGoalMinutes,
    thisWeek: weekTotals(days, monday),
    lastWeek: weekTotals(days, addDays(monday, -7)),
    weekBefore: weekTotals(days, addDays(monday, -14)),
    daysSinceStudy: lastStudied ? Math.max(0, daysBetween(lastStudied, today)) : null,
    currentStreak: computeStreak(days.map((d) => d.date), today).current,
    totalLessonsDone: days.reduce((s, d) => s + d.lessons, 0),
    attendance: { done: attendance.done, missed: attendance.missed, rate: attendance.rate },
    missedInARow: missedRun,
    reviewDue: review.due,
    outlooks,
    hasSchedule,
  };
});



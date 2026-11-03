import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, lessons, phases, roadmaps, studySessions } from "@/db/schema";
import { getUserPrefs } from "@/lib/progress/queries";
import { computeStreak, todayIn } from "@/lib/progress/streak";
import { attendanceRate, type DayPoint } from "./calendar";

/**
 * Every day this user completed something, in their own timezone. One row per study
 * day (not per lesson), so even a year of daily study is a few hundred small rows.
 */
export const getActivityDays = cache(async (userId: string, timezone: string): Promise<DayPoint[]> => {
  const localDay = sql<string>`to_char(${lessonProgress.completedAt} at time zone ${timezone}, 'YYYY-MM-DD')`;
  return db
    .select({
      date: localDay,
      lessons: sql<number>`count(*)::int`,
      minutes: sql<number>`coalesce(sum(coalesce(${lessonProgress.actualMinutes}, ${lessons.estimatedMinutes})), 0)::int`,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessons.id, lessonProgress.lessonId))
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.status, "completed")))
    // Positional: each use of `localDay` binds its own timezone parameter, so Postgres
    // wouldn't recognise GROUP BY <expr> as the selected expression.
    .groupBy(sql`1`)
    .orderBy(sql`1`);
});

export type Attendance = {
  /** Sessions already over, so each one counts as kept or missed. */
  done: number;
  missed: number;
  /** Scheduled but not yet closed by the reminder job. */
  upcoming: number;
  rate: number;
};

/** How reliably the user shows up for the sessions their schedule created. */
export const getAttendance = cache(async (userId: string, days = 30): Promise<Attendance> => {
  const [row] = await db
    .select({
      done: sql<number>`count(*) filter (where ${studySessions.status} = 'done')::int`,
      missed: sql<number>`count(*) filter (where ${studySessions.status} = 'missed')::int`,
      upcoming: sql<number>`count(*) filter (where ${studySessions.status} = 'upcoming')::int`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        sql`${studySessions.scheduledAt} >= now() - make_interval(days => ${days})`,
      ),
    );
  const done = row?.done ?? 0;
  const missed = row?.missed ?? 0;
  return { done, missed, upcoming: row?.upcoming ?? 0, rate: attendanceRate(done, missed) };
});

export type PhaseProgress = {
  roadmapId: string;
  roadmapTitle: string;
  phaseId: string;
  phaseTitle: string;
  total: number;
  done: number;
};

/** Lessons done per phase, for the active roadmaps, newest roadmap first. */
export async function getPhaseProgress(userId: string): Promise<PhaseProgress[]> {
  return db
    .select({
      roadmapId: roadmaps.id,
      roadmapTitle: roadmaps.title,
      phaseId: phases.id,
      phaseTitle: phases.title,
      total: sql<number>`count(${lessons.id})::int`,
      done: sql<number>`count(${lessonProgress.id}) filter (where ${lessonProgress.status} = 'completed')::int`,
    })
    .from(roadmaps)
    .innerJoin(phases, eq(phases.roadmapId, roadmaps.id))
    .leftJoin(lessons, eq(lessons.phaseId, phases.id))
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId)),
    )
    .where(and(eq(roadmaps.userId, userId), eq(roadmaps.status, "active")))
    .groupBy(roadmaps.id, roadmaps.title, roadmaps.createdAt, phases.id, phases.title, phases.orderIndex)
    .orderBy(desc(roadmaps.createdAt), asc(phases.orderIndex));
}

export type ProgressReport = {
  today: string;
  timezone: string;
  dailyGoalMinutes: number;
  days: DayPoint[];
  totals: { lessons: number; minutes: number; activeDays: number; bestStreak: number; currentStreak: number };
  attendance: Attendance;
  phases: PhaseProgress[];
};

/** Everything the progress page charts, in one round of parallel queries. */
export async function getProgressReport(userId: string): Promise<ProgressReport> {
  const { timezone, weeklyGoalMinutes } = await getUserPrefs(userId);
  const [days, attendance, phases] = await Promise.all([
    getActivityDays(userId, timezone),
    getAttendance(userId),
    getPhaseProgress(userId),
  ]);

  const today = todayIn(timezone);
  const streak = computeStreak(
    days.map((d) => d.date),
    today,
  );

  return {
    today,
    timezone,
    dailyGoalMinutes: Math.round(weeklyGoalMinutes / 7),
    days,
    totals: {
      lessons: days.reduce((s, d) => s + d.lessons, 0),
      minutes: days.reduce((s, d) => s + d.minutes, 0),
      activeDays: days.length,
      bestStreak: streak.best,
      currentStreak: streak.current,
    },
    attendance,
    phases,
  };
}

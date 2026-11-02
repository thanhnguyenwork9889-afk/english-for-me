import "server-only";
import { and, asc, desc, eq, isNull, or, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, lessons, phases, roadmaps, userSettings } from "@/db/schema";
import { addDays, computeStreak, todayIn, weekStart, type Streak } from "./streak";

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

export async function getUserPrefs(userId: string) {
  const [row] = await db
    .select({ timezone: userSettings.timezone, weeklyGoalMinutes: userSettings.weeklyGoalMinutes })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return { timezone: row?.timezone || DEFAULT_TZ, weeklyGoalMinutes: row?.weeklyGoalMinutes ?? 300 };
}

export type DayActivity = { date: string; lessons: number; minutes: number };

export type LearningStats = {
  today: string;
  streak: Streak;
  totalCompleted: number;
  week: { lessons: number; minutes: number; goalMinutes: number; days: DayActivity[] };
};

/** Per-day completions in the user's timezone → streak + this week's totals. */
export async function getLearningStats(userId: string): Promise<LearningStats> {
  const { timezone, weeklyGoalMinutes } = await getUserPrefs(userId);
  const localDay = sql<string>`to_char(${lessonProgress.completedAt} at time zone ${timezone}, 'YYYY-MM-DD')`;

  const rows: DayActivity[] = await db
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

  const today = todayIn(timezone);
  const monday = weekStart(today);
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return byDate.get(date) ?? { date, lessons: 0, minutes: 0 };
  });

  return {
    today,
    streak: computeStreak(rows.map((r) => r.date), today),
    totalCompleted: rows.reduce((s, r) => s + r.lessons, 0),
    week: {
      lessons: days.reduce((s, d) => s + d.lessons, 0),
      minutes: days.reduce((s, d) => s + d.minutes, 0),
      goalMinutes: weeklyGoalMinutes,
      days,
    },
  };
}

export type NextLesson = {
  lessonId: string;
  lessonTitle: string;
  estimatedMinutes: number;
  phaseTitle: string;
  roadmapId: string;
  roadmapTitle: string;
};

/** First unfinished lesson of the most recent active roadmap that still has work left. */
export async function getNextLesson(userId: string): Promise<NextLesson | null> {
  const [row] = await db
    .select({
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      estimatedMinutes: lessons.estimatedMinutes,
      phaseTitle: phases.title,
      roadmapId: roadmaps.id,
      roadmapTitle: roadmaps.title,
    })
    .from(lessons)
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId)),
    )
    .where(
      and(
        eq(roadmaps.userId, userId),
        eq(roadmaps.status, "active"),
        or(isNull(lessonProgress.status), ne(lessonProgress.status, "completed")),
      ),
    )
    .orderBy(desc(roadmaps.createdAt), asc(phases.orderIndex), asc(lessons.orderIndex), asc(lessons.createdAt))
    .limit(1);
  return row ?? null;
}

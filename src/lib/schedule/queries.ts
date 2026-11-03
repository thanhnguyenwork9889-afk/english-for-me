import "server-only";
import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, lessons, phases, roadmaps, studySchedules } from "@/db/schema";
import { getUserPrefs } from "@/lib/progress/queries";
import {
  assignLessons,
  isPast,
  nowIn,
  occurrencesBetween,
  projectFinishDate,
  type ScheduleRule,
} from "./occurrences";

export type RoadmapSchedule = ScheduleRule & { id: string; active: boolean };

export async function getRoadmapSchedule(userId: string, roadmapId: string): Promise<RoadmapSchedule | null> {
  const [row] = await db
    .select({
      id: studySchedules.id,
      daysOfWeek: studySchedules.daysOfWeek,
      startTime: studySchedules.startTime,
      durationMin: studySchedules.durationMin,
      active: studySchedules.active,
    })
    .from(studySchedules)
    .where(and(eq(studySchedules.userId, userId), eq(studySchedules.roadmapId, roadmapId)))
    .orderBy(desc(studySchedules.active))
    .limit(1);
  return row ?? null;
}

export type PendingLesson = { id: string; title: string; estimatedMinutes: number };

/** Unfinished lessons of a roadmap, in study order. */
export async function remainingLessons(userId: string, roadmapId: string): Promise<PendingLesson[]> {
  return db
    .select({ id: lessons.id, title: lessons.title, estimatedMinutes: lessons.estimatedMinutes })
    .from(lessons)
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .leftJoin(lessonProgress, and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId)))
    .where(
      and(
        eq(phases.roadmapId, roadmapId),
        or(isNull(lessonProgress.status), ne(lessonProgress.status, "completed")),
      ),
    )
    .orderBy(asc(phases.orderIndex), asc(lessons.orderIndex), asc(lessons.createdAt));
}

export type AgendaItem = {
  date: string;
  time: string;
  durationMin: number;
  roadmapId: string;
  roadmapTitle: string;
  lessons: PendingLesson[];
  past: boolean;
};

export type Agenda = {
  now: { date: string; time: string };
  items: AgendaItem[];
  hasSchedule: boolean;
};

/**
 * Upcoming study sessions across all active roadmap schedules for the next `days` days,
 * each pre-filled with the next unfinished lessons (computed, not stored).
 */
export async function getAgenda(userId: string, days = 14): Promise<Agenda> {
  const { timezone } = await getUserPrefs(userId);
  const now = nowIn(timezone);

  const schedules = await db
    .select({
      roadmapId: studySchedules.roadmapId,
      roadmapTitle: roadmaps.title,
      daysOfWeek: studySchedules.daysOfWeek,
      startTime: studySchedules.startTime,
      durationMin: studySchedules.durationMin,
    })
    .from(studySchedules)
    .innerJoin(roadmaps, eq(roadmaps.id, studySchedules.roadmapId))
    .where(
      and(eq(studySchedules.userId, userId), eq(studySchedules.active, true), eq(roadmaps.status, "active")),
    );

  const items: AgendaItem[] = [];
  for (const s of schedules) {
    if (!s.roadmapId) continue;
    const occ = occurrencesBetween(s, now.date, days);
    const upcoming = occ.filter((o) => !isPast(o, now));
    const batches = assignLessons(upcoming, await remainingLessons(userId, s.roadmapId));
    for (const o of occ) {
      const past = isPast(o, now);
      const idx = upcoming.indexOf(o);
      items.push({
        ...o,
        roadmapId: s.roadmapId,
        roadmapTitle: s.roadmapTitle,
        lessons: past ? [] : batches[idx] ?? [],
        past,
      });
    }
  }
  items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { now, items, hasSchedule: schedules.length > 0 };
}

/** Projected finish date for one roadmap given its schedule (null without a schedule). */
export async function getRoadmapForecast(userId: string, roadmapId: string) {
  const [schedule, { timezone }] = await Promise.all([getRoadmapSchedule(userId, roadmapId), getUserPrefs(userId)]);
  if (!schedule || !schedule.active) return { schedule, finishDate: null as string | null, today: nowIn(timezone).date };
  const remaining = await remainingLessons(userId, roadmapId);
  const now = nowIn(timezone);
  return { schedule, finishDate: projectFinishDate(schedule, remaining, now), today: now.date };
}

/** Distinct "HH:MM" start times of the user's active schedules. */
export async function getStudyTimes(userId: string): Promise<string[]> {
  const rows = await db
    .select({ startTime: studySchedules.startTime })
    .from(studySchedules)
    .where(and(eq(studySchedules.userId, userId), eq(studySchedules.active, true)));
  return [...new Set(rows.map((r) => r.startTime.slice(0, 5)))].sort();
}

import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessons, phases, roadmaps } from "@/db/schema";

export type RoadmapSummary = {
  id: string;
  title: string;
  goal: string | null;
  startDate: string;
  targetDate: string | null;
  status: string;
  lessonCount: number;
  totalMinutes: number;
};

export type LessonItem = {
  id: string;
  title: string;
  estimatedMinutes: number;
  resourceUrls: string[];
  contentMd: string | null;
};

export type PhaseWithLessons = { id: string; title: string; lessons: LessonItem[] };

export type RoadmapTree = Omit<RoadmapSummary, "lessonCount" | "totalMinutes"> & {
  description: string | null;
  phases: PhaseWithLessons[];
};

export async function listRoadmaps(userId: string): Promise<RoadmapSummary[]> {
  return db
    .select({
      id: roadmaps.id,
      title: roadmaps.title,
      goal: roadmaps.goal,
      startDate: roadmaps.startDate,
      targetDate: roadmaps.targetDate,
      status: roadmaps.status,
      lessonCount: sql<number>`count(${lessons.id})::int`,
      totalMinutes: sql<number>`coalesce(sum(${lessons.estimatedMinutes}), 0)::int`,
    })
    .from(roadmaps)
    .leftJoin(phases, eq(phases.roadmapId, roadmaps.id))
    .leftJoin(lessons, eq(lessons.phaseId, phases.id))
    .where(eq(roadmaps.userId, userId))
    .groupBy(roadmaps.id)
    .orderBy(desc(roadmaps.createdAt));
}

export async function getRoadmapTree(userId: string, roadmapId: string): Promise<RoadmapTree | null> {
  const [roadmap] = await db
    .select()
    .from(roadmaps)
    .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)));
  if (!roadmap) return null;

  const phaseRows = await db
    .select({ id: phases.id, title: phases.title })
    .from(phases)
    .where(eq(phases.roadmapId, roadmapId))
    .orderBy(asc(phases.orderIndex), asc(phases.id));

  const lessonRows = phaseRows.length
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.phaseId, phaseRows.map((p) => p.id)))
        .orderBy(asc(lessons.orderIndex), asc(lessons.createdAt))
    : [];

  return {
    id: roadmap.id,
    title: roadmap.title,
    description: roadmap.description,
    goal: roadmap.goal,
    startDate: roadmap.startDate,
    targetDate: roadmap.targetDate,
    status: roadmap.status,
    phases: phaseRows.map((p) => ({
      ...p,
      lessons: lessonRows
        .filter((l) => l.phaseId === p.id)
        .map((l) => ({
          id: l.id,
          title: l.title,
          estimatedMinutes: l.estimatedMinutes,
          resourceUrls: l.resourceUrls ?? [],
          contentMd: l.contentMd,
        })),
    })),
  };
}

// ---------- Ownership checks (db client bypasses RLS, so every write goes through these) ----------

export async function ownsRoadmap(userId: string, roadmapId: string) {
  const rows = await db
    .select({ id: roadmaps.id })
    .from(roadmaps)
    .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)));
  return rows.length > 0;
}

/** Returns the phase's roadmapId if the user owns it. */
export async function ownedPhaseRoadmap(userId: string, phaseId: string): Promise<string | null> {
  const [row] = await db
    .select({ roadmapId: phases.roadmapId })
    .from(phases)
    .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
    .where(and(eq(phases.id, phaseId), eq(roadmaps.userId, userId)));
  return row?.roadmapId ?? null;
}

/** Returns the lesson's roadmapId if the user owns it. */
export async function ownedLessonRoadmap(userId: string, lessonId: string): Promise<string | null> {
  const [row] = await db
    .select({ roadmapId: phases.roadmapId })
    .from(lessons)
    .innerJoin(phases, eq(phases.id, lessons.phaseId))
    .innerJoin(roadmaps, eq(roadmaps.id, phases.roadmapId))
    .where(and(eq(lessons.id, lessonId), eq(roadmaps.userId, userId)));
  return row?.roadmapId ?? null;
}

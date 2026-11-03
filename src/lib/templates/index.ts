import { buildLesson, type BuiltLesson, type TemplateExerciseInput } from "./build";
import { everydayA0Vi } from "./everyday-a0-vi";
import { everydayA0ViExercises } from "./everyday-a0-vi-exercises";

export type RoadmapTemplate = {
  id: string;
  /** Language the lesson content is written in. */
  contentLocale: "vi" | "en";
  title: string;
  goal: string;
  level: string;
  weeks: number;
  minutesPerDay: number;
  phases: { title: string; lessons: BuiltLesson[] }[];
};

const make = (
  meta: Omit<RoadmapTemplate, "phases">,
  src: { phases: { title: string; lessons: Parameters<typeof buildLesson>[0][] }[] },
  /** Practice questions kept in a separate file, matched to lessons by title. */
  exercises: Record<string, TemplateExerciseInput[]> = {},
): RoadmapTemplate => ({
  ...meta,
  phases: src.phases.map((p) => ({
    title: p.title,
    lessons: p.lessons.map((l) => buildLesson({ ...l, ex: l.ex ?? exercises[l.title] }, meta.minutesPerDay)),
  })),
});

export const templates: RoadmapTemplate[] = [
  make(
    {
      id: "everyday-a0-vi",
      contentLocale: "vi",
      title: "Tiếng Anh giao tiếp cho người mất gốc",
      goal: "Tự tin giao tiếp các tình huống hằng ngày (A0 → A2)",
      level: "A0 → A2",
      weeks: 12,
      minutesPerDay: 30,
    },
    everydayA0Vi,
    everydayA0ViExercises,
  ),
];

/**
 * Questions for a lesson title, across every template. Lets roadmaps created before the
 * practice feature existed pick up their questions by title.
 */
export const exercisesForTitle = (title: string): TemplateExerciseInput[] =>
  everydayA0ViExercises[title] ?? [];

export const exerciseCountOf = (t: RoadmapTemplate) =>
  t.phases.reduce((s, p) => s + p.lessons.reduce((n, l) => n + l.exercises.length, 0), 0);

export const getTemplate = (id: string) => templates.find((t) => t.id === id) ?? null;

export const lessonCountOf = (t: RoadmapTemplate) => t.phases.reduce((s, p) => s + p.lessons.length, 0);

/** Lightweight data for the gallery cards (no lesson bodies sent to the client). */
export const templateCards = () =>
  templates.map((t) => ({
    id: t.id,
    title: t.title,
    goal: t.goal,
    level: t.level,
    weeks: t.weeks,
    minutesPerDay: t.minutesPerDay,
    lessonCount: lessonCountOf(t),
    contentLocale: t.contentLocale,
    phaseTitles: t.phases.map((p) => p.title),
  }));

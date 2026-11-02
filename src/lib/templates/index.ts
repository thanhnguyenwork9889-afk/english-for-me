import { buildLesson, type BuiltLesson } from "./build";
import { everydayA0Vi } from "./everyday-a0-vi";

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
): RoadmapTemplate => ({
  ...meta,
  phases: src.phases.map((p) => ({
    title: p.title,
    lessons: p.lessons.map((l) => buildLesson(l, meta.minutesPerDay)),
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
  ),
];

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

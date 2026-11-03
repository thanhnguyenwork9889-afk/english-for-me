import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import vi from "@/i18n/dictionaries/vi.json";
import { buildInsights, weeklyReport, type Facts } from "./rules";

const dictionaries = { vi, en } as const;

const base: Facts = {
  today: "2026-03-13", // Friday, so the week-over-week rules are in play
  weeklyGoalMinutes: 300,
  thisWeek: { minutes: 0, lessons: 0 },
  lastWeek: { minutes: 0, lessons: 0 },
  weekBefore: { minutes: 0, lessons: 0 },
  daysSinceStudy: 0,
  currentStreak: 0,
  totalLessonsDone: 10,
  attendance: { done: 0, missed: 0, rate: 0 },
  missedInARow: 0,
  reviewDue: 0,
  outlooks: [],
  hasSchedule: true,
};

const outlook = { roadmapId: "r", title: "A0", remainingLessons: 10, remainingMinutes: 300 };

/** Inputs chosen to make every rule fire at least once. */
const insightCases: Partial<Facts>[] = [
  { totalLessonsDone: 0 },
  { daysSinceStudy: 5 },
  { outlooks: [{ ...outlook, finishDate: "2026-09-01", targetDate: "2026-04-01" }] },
  { outlooks: [{ ...outlook, finishDate: "2026-04-01", targetDate: "2026-09-01" }] },
  { outlooks: [{ ...outlook, remainingLessons: 0, remainingMinutes: 0, finishDate: null, targetDate: null }] },
  { missedInARow: 5 },
  { reviewDue: 30 },
  { reviewDue: 5 },
  { hasSchedule: false },
  { today: "2026-03-11", thisWeek: { minutes: 50, lessons: 1 } }, // Wednesday
  { lastWeek: { minutes: 300, lessons: 8 }, thisWeek: { minutes: 50, lessons: 1 } },
  { lastWeek: { minutes: 100, lessons: 3 }, thisWeek: { minutes: 400, lessons: 9 } },
  { currentStreak: 7 },
  { attendance: { done: 9, missed: 1, rate: 90 } },
];

const headlineCases: Partial<Facts>[] = [
  { lastWeek: { minutes: 0, lessons: 0 } },
  { lastWeek: { minutes: 150, lessons: 5 }, outlooks: [{ ...outlook, finishDate: "2026-09-01", targetDate: "2026-04-01" }] },
  { lastWeek: { minutes: 320, lessons: 9 } },
  { lastWeek: { minutes: 60, lessons: 2 }, weekBefore: { minutes: 300, lessons: 8 } },
  // Below the goal on purpose: "goal met" outranks "improving", so it would mask it.
  { lastWeek: { minutes: 200, lessons: 6 }, weekBefore: { minutes: 100, lessons: 3 } },
  { lastWeek: { minutes: 150, lessons: 5 }, reviewDue: 12 },
  { lastWeek: { minutes: 150, lessons: 5 }, weekBefore: { minutes: 150, lessons: 5 } },
];

/** kind → the variable names that rule supplies. */
const varsByKind = new Map<string, Set<string>>();
for (const over of insightCases) {
  for (const insight of buildInsights({ ...base, ...over }, 99)) {
    const known = varsByKind.get(insight.kind) ?? new Set<string>();
    for (const key of Object.keys(insight.vars)) known.add(key);
    varsByKind.set(insight.kind, known);
  }
}
const headlineKinds = new Set(headlineCases.map((over) => weeklyReport({ ...base, ...over }).headline.kind));

describe("supervisor copy", () => {
  it("drives every rule, so the coverage checks below mean something", () => {
    // Bump these when a rule is added — the point is that nothing ships unworded.
    expect([...varsByKind.keys()].sort()).toEqual([
      "behindSchedule",
      "comeback",
      "firstLesson",
      "goalAtRisk",
      "goalMet",
      "goalProgress",
      "improving",
      "missedRun",
      "noSchedule",
      "onTrack",
      "reliable",
      "reviewDue",
      "reviewPileUp",
      "roadmapDone",
      "slowingDown",
      "streak",
    ]);
    expect(headlineKinds.size).toBe(7);
  });

  for (const [lang, dict] of Object.entries(dictionaries)) {
    const t = dict.supervisor;
    const copies = t.insights as Record<string, { title: string; body: string } | undefined>;

    it(`${lang}: words every insight`, () => {
      for (const kind of varsByKind.keys()) {
        const copy = copies[kind];
        expect(copy, `${lang} is missing supervisor.insights.${kind}`).toBeTruthy();
        expect(copy!.title.length, `${lang} ${kind} title`).toBeGreaterThan(3);
        expect(copy!.body.length, `${lang} ${kind} body`).toBeGreaterThan(10);
      }
    });

    it(`${lang}: uses only placeholders the rule actually supplies`, () => {
      for (const [kind, vars] of varsByKind) {
        const copy = copies[kind]!;
        for (const match of `${copy.title} ${copy.body}`.matchAll(/\{(\w+)\}/g)) {
          expect(vars.has(match[1]), `${lang} ${kind} uses {${match[1]}}, which the rule never sets`).toBe(true);
        }
      }
    });

    it(`${lang}: words every weekly headline`, () => {
      const headlines = t.weekly.headlines as Record<string, string | undefined>;
      for (const kind of headlineKinds) {
        expect(headlines[kind], `${lang} is missing supervisor.weekly.headlines.${kind}`).toBeTruthy();
      }
    });

    it(`${lang}: labels every action link`, () => {
      for (const action of ["roadmaps", "review", "schedule"] as const) {
        expect(t.act[action], `${lang} act.${action}`).toBeTruthy();
      }
    });
  }
});

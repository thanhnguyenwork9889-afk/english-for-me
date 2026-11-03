import { describe, expect, it } from "vitest";
import { buildInsights, weeklyReport, type Facts } from "./rules";

// 2026-03-11 is a Wednesday, 2026-03-13 a Friday — the rules treat Friday on as
// "late in the week", when part-week comparisons become fair.
const WEDNESDAY = "2026-03-11";
const FRIDAY = "2026-03-13";

const facts = (over: Partial<Facts> = {}): Facts => ({
  today: WEDNESDAY,
  weeklyGoalMinutes: 300,
  thisWeek: { minutes: 120, lessons: 4 },
  lastWeek: { minutes: 150, lessons: 5 },
  weekBefore: { minutes: 150, lessons: 5 },
  daysSinceStudy: 0,
  currentStreak: 1,
  totalLessonsDone: 20,
  attendance: { done: 4, missed: 1, rate: 80 },
  missedInARow: 0,
  reviewDue: 0,
  outlooks: [],
  hasSchedule: true,
  ...over,
});

const kinds = (f: Facts, limit?: number) => buildInsights(f, limit).map((i) => i.kind);

describe("buildInsights", () => {
  it("says only one thing before the first lesson is done", () => {
    expect(kinds(facts({ totalLessonsDone: 0, reviewDue: 20, missedInARow: 5 }))).toEqual(["firstLesson"]);
  });

  it("puts warnings before notes and praise", () => {
    const list = buildInsights(
      facts({ today: FRIDAY, missedInARow: 4, currentStreak: 5, thisWeek: { minutes: 400, lessons: 9 } }),
    );
    expect(list[0].tone).toBe("warn");
    // Ranked warn → info → good, which is not alphabetical order.
    const rank = { warn: 0, info: 1, good: 2 } as const;
    const ranks = list.map((i) => rank[i.tone]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("notices a break and asks for only one lesson back", () => {
    const list = buildInsights(facts({ daysSinceStudy: 4 }));
    expect(list[0]).toMatchObject({ kind: "comeback", tone: "warn", vars: { days: 4 }, action: "roadmaps" });
  });

  it("ignores a one-day gap", () => {
    expect(kinds(facts({ daysSinceStudy: 1 }))).not.toContain("comeback");
  });

  describe("roadmap deadline", () => {
    const outlook = {
      roadmapId: "r1",
      title: "A0",
      remainingLessons: 20,
      remainingMinutes: 600,
    };

    it("warns with the shortfall and the pace needed to catch up", () => {
      const list = buildInsights(
        facts({ outlooks: [{ ...outlook, finishDate: "2026-04-30", targetDate: "2026-04-20" }] }),
      );
      expect(list[0]).toMatchObject({
        kind: "behindSchedule",
        tone: "warn",
        // 600 minutes over the 40 days to the target ≈ 105 minutes a week.
        vars: { lateDays: 10, needMinutes: 105, title: "A0" },
      });
    });

    it("praises a roadmap that lands on time", () => {
      expect(kinds(facts({ outlooks: [{ ...outlook, finishDate: "2026-04-10", targetDate: "2026-04-20" }] }))).toContain(
        "onTrack",
      );
    });

    it("says nothing about the deadline of a finished roadmap", () => {
      const done = { ...outlook, remainingLessons: 0, remainingMinutes: 0 };
      const list = kinds(facts({ outlooks: [{ ...done, finishDate: "2026-04-30", targetDate: "2026-04-20" }] }));
      expect(list).not.toContain("behindSchedule");
      expect(list).toContain("roadmapDone");
    });

    it("stays quiet when there is no schedule to project from", () => {
      expect(
        kinds(facts({ hasSchedule: false, outlooks: [{ ...outlook, finishDate: null, targetDate: "2026-04-20" }] })),
      ).not.toContain("behindSchedule");
    });
  });

  it("reads a run of missed sessions as a bad study time, and points at the schedule", () => {
    const list = buildInsights(facts({ missedInARow: 3 }));
    expect(list[0]).toMatchObject({ kind: "missedRun", vars: { n: 3 }, action: "schedule" });
    expect(kinds(facts({ missedInARow: 2 }))).not.toContain("missedRun");
  });

  describe("the weekly goal", () => {
    it("is only called at risk once most of the week has gone", () => {
      const low = { minutes: 100, lessons: 2 }; // a third of the 300-minute goal
      expect(kinds(facts({ today: WEDNESDAY, thisWeek: low }))).toContain("goalProgress");
      expect(kinds(facts({ today: WEDNESDAY, thisWeek: low }))).not.toContain("goalAtRisk");
      expect(kinds(facts({ today: FRIDAY, thisWeek: low }))).toContain("goalAtRisk");
    });

    it("congratulates reaching it", () => {
      expect(kinds(facts({ thisWeek: { minutes: 300, lessons: 8 } }))).toContain("goalMet");
    });
  });

  it("compares weeks only when the comparison is fair", () => {
    const halved = { thisWeek: { minutes: 50, lessons: 1 }, lastWeek: { minutes: 200, lessons: 6 } };
    expect(kinds(facts({ today: WEDNESDAY, ...halved }))).not.toContain("slowingDown");
    expect(kinds(facts({ today: FRIDAY, ...halved }))).toContain("slowingDown");

    const up = { thisWeek: { minutes: 300, lessons: 8 }, lastWeek: { minutes: 200, lessons: 6 } };
    expect(buildInsights(facts({ today: FRIDAY, ...up })).find((i) => i.kind === "improving")).toMatchObject({
      vars: { percent: 50 },
    });
  });

  it("escalates the review queue once it piles up", () => {
    expect(kinds(facts({ reviewDue: 6 }))).toContain("reviewDue");
    const big = buildInsights(facts({ reviewDue: 20 }));
    expect(big.map((i) => i.kind)).toContain("reviewPileUp");
    expect(big.map((i) => i.kind)).not.toContain("reviewDue");
    expect(kinds(facts({ reviewDue: 0 }))).not.toContain("reviewDue");
  });

  it("keeps the list short", () => {
    const busy = facts({
      today: FRIDAY,
      daysSinceStudy: 5,
      missedInARow: 6,
      reviewDue: 30,
      currentStreak: 10,
      thisWeek: { minutes: 10, lessons: 1 },
      hasSchedule: false,
      outlooks: [
        { roadmapId: "r", title: "A0", remainingLessons: 5, remainingMinutes: 150, finishDate: "2026-09-01", targetDate: "2026-04-01" },
      ],
    });
    expect(buildInsights(busy)).toHaveLength(5);
    expect(buildInsights(busy, 2)).toHaveLength(2);
  });
});

describe("weeklyReport", () => {
  it("reports the week that ended, not the one in progress", () => {
    const r = weeklyReport(facts({ thisWeek: { minutes: 0, lessons: 0 }, lastWeek: { minutes: 240, lessons: 7 } }));
    expect(r).toMatchObject({ minutes: 240, lessons: 7, goalPercent: 80 });
  });

  it("compares against the week before, and says nothing when there is no base", () => {
    expect(
      weeklyReport(facts({ lastWeek: { minutes: 300, lessons: 8 }, weekBefore: { minutes: 200, lessons: 5 } }))
        .changePercent,
    ).toBe(50);
    expect(weeklyReport(facts({ weekBefore: { minutes: 0, lessons: 0 } })).changePercent).toBeNull();
  });

  it("leads with the blank week when nothing was studied", () => {
    expect(weeklyReport(facts({ lastWeek: { minutes: 0, lessons: 0 } })).headline).toEqual({
      kind: "weeklyNothing",
      tone: "warn",
    });
  });

  it("leads with the deadline over a met goal, since it matters more", () => {
    const r = weeklyReport(
      facts({
        lastWeek: { minutes: 400, lessons: 10 },
        outlooks: [
          { roadmapId: "r", title: "A0", remainingLessons: 10, remainingMinutes: 300, finishDate: "2026-09-01", targetDate: "2026-04-01" },
        ],
      }),
    );
    expect(r.headline.kind).toBe("weeklyBehind");
  });

  it("praises a met goal and flags a big drop", () => {
    expect(weeklyReport(facts({ lastWeek: { minutes: 320, lessons: 9 } })).headline.kind).toBe("weeklyGoalMet");
    expect(
      weeklyReport(facts({ lastWeek: { minutes: 60, lessons: 2 }, weekBefore: { minutes: 300, lessons: 8 } })).headline
        .kind,
    ).toBe("weeklySlowing");
  });

  it("falls back to encouragement", () => {
    expect(weeklyReport(facts({ lastWeek: { minutes: 160, lessons: 5 } })).headline.kind).toBe("weeklyKeepGoing");
  });
});

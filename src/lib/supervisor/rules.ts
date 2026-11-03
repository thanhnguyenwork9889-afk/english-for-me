// The supervisor: turns a snapshot of the learner's numbers into a short list of
// observations and suggestions. Pure rules, no AI and no cost — an AI pass can be
// layered on later to reword these, but the judgements themselves live here.

import { daysBetween, isoDow } from "@/lib/schedule/occurrences";

export type WeekTotals = { minutes: number; lessons: number };

export type RoadmapOutlook = {
  roadmapId: string;
  title: string;
  /** Projected finish at the current pace; null without an active schedule. */
  finishDate: string | null;
  targetDate: string | null;
  remainingLessons: number;
  remainingMinutes: number;
};

export type Facts = {
  /** Today in the learner's timezone, "YYYY-MM-DD". */
  today: string;
  weeklyGoalMinutes: number;
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
  /** The week before last — what the Monday report compares `lastWeek` against. */
  weekBefore: WeekTotals;
  /** Days since the last completed lesson; null if nothing has ever been completed. */
  daysSinceStudy: number | null;
  currentStreak: number;
  totalLessonsDone: number;
  attendance: { done: number; missed: number; rate: number };
  /** Most recent run of missed sessions, newest first. */
  missedInARow: number;
  reviewDue: number;
  outlooks: RoadmapOutlook[];
  hasSchedule: boolean;
};

export type InsightTone = "good" | "info" | "warn";

export type Insight = {
  /** Stable key; the dictionary holds the wording for `<kind>.title` / `<kind>.body`. */
  kind: string;
  tone: InsightTone;
  /** Numbers to interpolate into those strings. */
  vars: Record<string, string | number>;
  /** Page that lets the learner act on it. */
  action?: "roadmaps" | "review" | "schedule";
};

/** Monday = 0 … Sunday = 6. */
const weekdayIndex = (iso: string) => isoDow(iso) - 1;

/** Comparing a part-week against a whole one is unfair before the week is mostly done. */
const LATE_IN_WEEK = 4; // Friday

const pct = (value: number, of: number) => (of > 0 ? Math.round((value / of) * 100) : 0);

/** Minutes per week needed to clear `minutes` of work by `target`. */
function pacePerWeek(minutes: number, today: string, target: string): number {
  const days = Math.max(daysBetween(today, target), 1);
  return Math.ceil(minutes / (days / 7));
}

/**
 * Observations for the learner, most urgent first and capped so the list stays readable.
 * Order within a tone is the order the rules appear below, which is deliberate.
 */
export function buildInsights(facts: Facts, limit = 5): Insight[] {
  // Nothing else means anything until there is a first completed lesson.
  if (facts.totalLessonsDone === 0) {
    return [{ kind: "firstLesson", tone: "info", vars: {}, action: "roadmaps" }];
  }

  const out: Insight[] = [];
  const day = weekdayIndex(facts.today);
  const { thisWeek, lastWeek, weeklyGoalMinutes: goal } = facts;

  // --- Things that need attention ---

  // Back after a break: say so gently and shrink the ask to one lesson.
  if (facts.daysSinceStudy !== null && facts.daysSinceStudy >= 3) {
    out.push({
      kind: "comeback",
      tone: "warn",
      vars: { days: facts.daysSinceStudy },
      action: "roadmaps",
    });
  }

  // Behind the roadmap's own deadline, at the current pace.
  for (const o of facts.outlooks) {
    if (!o.finishDate || !o.targetDate || o.remainingLessons === 0) continue;
    if (o.finishDate <= o.targetDate) continue;
    out.push({
      kind: "behindSchedule",
      tone: "warn",
      vars: {
        title: o.title,
        finishDate: o.finishDate,
        targetDate: o.targetDate,
        lateDays: daysBetween(o.targetDate, o.finishDate),
        needMinutes: pacePerWeek(o.remainingMinutes, facts.today, o.targetDate),
      },
      action: "schedule",
    });
  }

  // Sessions going by untouched usually means the time of day is wrong, not laziness.
  if (facts.missedInARow >= 3) {
    out.push({ kind: "missedRun", tone: "warn", vars: { n: facts.missedInARow }, action: "schedule" });
  }

  if (facts.reviewDue >= 15) {
    out.push({ kind: "reviewPileUp", tone: "warn", vars: { n: facts.reviewDue }, action: "review" });
  }

  // Only call the weekly goal missed once most of the week has gone.
  if (goal > 0 && day >= LATE_IN_WEEK && thisWeek.minutes < goal * 0.6) {
    out.push({
      kind: "goalAtRisk",
      tone: "warn",
      vars: { done: thisWeek.minutes, goal, left: Math.max(0, goal - thisWeek.minutes) },
      action: "roadmaps",
    });
  }

  // --- Things worth knowing ---

  if (!facts.hasSchedule) {
    out.push({ kind: "noSchedule", tone: "info", vars: {}, action: "schedule" });
  }

  if (facts.reviewDue > 0 && facts.reviewDue < 15) {
    out.push({ kind: "reviewDue", tone: "info", vars: { n: facts.reviewDue }, action: "review" });
  }

  if (goal > 0 && thisWeek.minutes < goal && day < LATE_IN_WEEK) {
    out.push({
      kind: "goalProgress",
      tone: "info",
      vars: { done: thisWeek.minutes, goal, left: goal - thisWeek.minutes, percent: pct(thisWeek.minutes, goal) },
    });
  }

  if (lastWeek.minutes > 0 && day >= LATE_IN_WEEK && thisWeek.minutes < lastWeek.minutes * 0.6) {
    out.push({
      kind: "slowingDown",
      tone: "info",
      vars: { thisWeek: thisWeek.minutes, lastWeek: lastWeek.minutes },
      action: "roadmaps",
    });
  }

  // --- Things that went well ---

  if (goal > 0 && thisWeek.minutes >= goal) {
    out.push({ kind: "goalMet", tone: "good", vars: { done: thisWeek.minutes, goal } });
  }

  if (lastWeek.minutes > 0 && thisWeek.minutes > lastWeek.minutes && day >= LATE_IN_WEEK) {
    out.push({
      kind: "improving",
      tone: "good",
      vars: { percent: pct(thisWeek.minutes - lastWeek.minutes, lastWeek.minutes) },
    });
  }

  if (facts.currentStreak >= 3) {
    out.push({ kind: "streak", tone: "good", vars: { n: facts.currentStreak } });
  }

  const finished = facts.attendance.done + facts.attendance.missed;
  if (finished >= 5 && facts.attendance.rate >= 80) {
    out.push({ kind: "reliable", tone: "good", vars: { rate: facts.attendance.rate } });
  }

  for (const o of facts.outlooks) {
    if (o.remainingLessons === 0) {
      out.push({ kind: "roadmapDone", tone: "good", vars: { title: o.title }, action: "roadmaps" });
    } else if (o.finishDate && o.targetDate && o.finishDate <= o.targetDate) {
      out.push({ kind: "onTrack", tone: "good", vars: { title: o.title, finishDate: o.finishDate } });
    }
  }

  const rank: Record<InsightTone, number> = { warn: 0, info: 1, good: 2 };
  return out
    .map((insight, i) => ({ insight, i }))
    .sort((a, b) => rank[a.insight.tone] - rank[b.insight.tone] || a.i - b.i)
    .slice(0, limit)
    .map(({ insight }) => insight);
}

export type WeeklyReport = {
  /** Last week's totals — the week being reported on, not the one in progress. */
  minutes: number;
  lessons: number;
  goalMinutes: number;
  goalPercent: number;
  /** Change against the week before; null when that week was empty, so there is no base. */
  changePercent: number | null;
  streak: number;
  reviewDue: number;
  /** One remark to carry in the notification, chosen from last week's numbers. */
  headline: { kind: string; tone: InsightTone };
};

/**
 * The Monday summary. It reports the week that just ended, so it judges `lastWeek` —
 * `buildInsights` is about the week in progress and would see an empty Monday.
 */
export function weeklyReport(facts: Facts): WeeklyReport {
  const { lastWeek, weekBefore, weeklyGoalMinutes: goal } = facts;
  const changePercent =
    weekBefore.minutes > 0 ? pct(lastWeek.minutes - weekBefore.minutes, weekBefore.minutes) : null;

  const behind = facts.outlooks.some(
    (o) => o.finishDate && o.targetDate && o.remainingLessons > 0 && o.finishDate > o.targetDate,
  );

  const headline: WeeklyReport["headline"] =
    lastWeek.minutes === 0
      ? { kind: "weeklyNothing", tone: "warn" }
      : behind
        ? { kind: "weeklyBehind", tone: "warn" }
        : goal > 0 && lastWeek.minutes >= goal
          ? { kind: "weeklyGoalMet", tone: "good" }
          : changePercent !== null && changePercent <= -40
            ? { kind: "weeklySlowing", tone: "warn" }
            : changePercent !== null && changePercent >= 20
              ? { kind: "weeklyImproving", tone: "good" }
              : facts.reviewDue >= 10
                ? { kind: "weeklyReview", tone: "info" }
                : { kind: "weeklyKeepGoing", tone: "info" };

  return {
    minutes: lastWeek.minutes,
    lessons: lastWeek.lessons,
    goalMinutes: goal,
    goalPercent: pct(lastWeek.minutes, goal),
    changePercent,
    streak: facts.currentStreak,
    reviewDue: facts.reviewDue,
    headline,
  };
}

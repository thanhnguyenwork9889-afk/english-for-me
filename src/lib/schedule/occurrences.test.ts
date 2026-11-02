import { describe, expect, it } from "vitest";
import {
  assignLessons,
  daysBetween,
  isoDow,
  isPast,
  nowIn,
  occurrencesBetween,
  projectFinishDate,
  type ScheduleRule,
} from "./occurrences";

const monWedFri: ScheduleRule = { daysOfWeek: [1, 3, 5], startTime: "20:00:00", durationMin: 30 };
const lessons = (n: number, min = 30) => Array.from({ length: n }, (_, i) => ({ id: `L${i}`, estimatedMinutes: min }));

describe("occurrences", () => {
  it("isoDow maps Monday=1 … Sunday=7", () => {
    expect(isoDow("2026-11-02")).toBe(1);
    expect(isoDow("2026-11-08")).toBe(7);
  });

  it("lists matching weekdays in range, normalising the time", () => {
    const occ = occurrencesBetween(monWedFri, "2026-11-02", 7);
    expect(occ.map((o) => o.date)).toEqual(["2026-11-02", "2026-11-04", "2026-11-06"]);
    expect(occ[0].time).toBe("20:00");
  });

  it("empty rule yields nothing", () => {
    expect(occurrencesBetween({ ...monWedFri, daysOfWeek: [] }, "2026-11-02", 30)).toEqual([]);
  });

  it("isPast compares date then time", () => {
    const now = { date: "2026-11-02", time: "19:59" };
    expect(isPast({ date: "2026-11-02", time: "20:00" }, now)).toBe(false);
    expect(isPast({ date: "2026-11-02", time: "19:00" }, now)).toBe(true);
    expect(isPast({ date: "2026-11-01", time: "23:00" }, now)).toBe(true);
  });
});

describe("assignLessons", () => {
  it("puts one 30-min lesson in each 30-min session", () => {
    const occ = occurrencesBetween(monWedFri, "2026-11-02", 7);
    expect(assignLessons(occ, lessons(5)).map((b) => b.map((l) => l.id))).toEqual([["L0"], ["L1"], ["L2"]]);
  });

  it("fills longer sessions with several lessons", () => {
    const occ = occurrencesBetween({ ...monWedFri, durationMin: 60 }, "2026-11-02", 7);
    expect(assignLessons(occ, lessons(5)).map((b) => b.length)).toEqual([2, 2, 1]);
  });

  it("always gives an oversized lesson its own session", () => {
    const occ = occurrencesBetween(monWedFri, "2026-11-02", 7);
    expect(assignLessons(occ, lessons(2, 90)).map((b) => b.length)).toEqual([1, 1, 0]);
  });
});

describe("projectFinishDate", () => {
  it("skips today's session if it already started", () => {
    // Mon 2026-11-02 21:00 → next sessions Wed 4, Fri 6, Mon 9
    expect(projectFinishDate(monWedFri, lessons(3), { date: "2026-11-02", time: "21:00" })).toBe("2026-11-09");
    expect(projectFinishDate(monWedFri, lessons(3), { date: "2026-11-02", time: "08:00" })).toBe("2026-11-06");
  });

  it("handles long roadmaps beyond the first window", () => {
    // 60 lessons, 3/week → 20 weeks
    const d = projectFinishDate(monWedFri, lessons(60), { date: "2026-11-02", time: "08:00" })!;
    expect(daysBetween("2026-11-02", d)).toBe(19 * 7 + 4); // Friday of week 20
  });

  it("returns null with no schedule or no lessons", () => {
    expect(projectFinishDate({ ...monWedFri, daysOfWeek: [] }, lessons(3), { date: "2026-11-02", time: "08:00" })).toBeNull();
    expect(projectFinishDate(monWedFri, [], { date: "2026-11-02", time: "08:00" })).toBeNull();
  });
});

describe("nowIn", () => {
  it("returns local date and time", () => {
    expect(nowIn("Asia/Ho_Chi_Minh", new Date("2026-11-01T20:30:00Z"))).toEqual({ date: "2026-11-02", time: "03:30" });
  });
});

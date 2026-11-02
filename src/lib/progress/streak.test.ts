import { describe, expect, it } from "vitest";
import { addDays, computeStreak, todayIn, weekStart } from "./streak";

describe("computeStreak", () => {
  it("is zero with no study days", () => {
    expect(computeStreak([], "2026-11-02")).toEqual({ current: 0, best: 0, studiedToday: false });
  });

  it("counts consecutive days ending today", () => {
    const s = computeStreak(["2026-10-31", "2026-11-01", "2026-11-02"], "2026-11-02");
    expect(s).toEqual({ current: 3, best: 3, studiedToday: true });
  });

  it("keeps the streak alive if today isn't done yet", () => {
    const s = computeStreak(["2026-10-31", "2026-11-01"], "2026-11-02");
    expect(s.current).toBe(2);
    expect(s.studiedToday).toBe(false);
  });

  it("breaks after a missed day", () => {
    expect(computeStreak(["2026-10-30", "2026-10-31"], "2026-11-02").current).toBe(0);
  });

  it("tracks the best run separately from the current one", () => {
    const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-11-01", "2026-11-02"];
    expect(computeStreak(days, "2026-11-02")).toMatchObject({ current: 2, best: 4 });
  });

  it("ignores duplicates and unsorted input", () => {
    const s = computeStreak(["2026-11-02", "2026-11-01", "2026-11-02", "2026-11-01"], "2026-11-02");
    expect(s).toMatchObject({ current: 2, best: 2 });
  });

  it("crosses month and year boundaries", () => {
    expect(computeStreak(["2026-12-31", "2027-01-01"], "2027-01-01").current).toBe(2);
    expect(computeStreak(["2028-02-28", "2028-02-29", "2028-03-01"], "2028-03-01").current).toBe(3);
  });

  it("ignores future-dated days for best streak", () => {
    expect(computeStreak(["2026-11-05", "2026-11-06", "2026-11-07"], "2026-11-02").best).toBe(0);
  });
});

describe("date helpers", () => {
  it("weekStart returns Monday", () => {
    expect(weekStart("2026-11-02")).toBe("2026-11-02"); // Monday
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(weekStart("2026-11-01")).toBe("2026-10-26"); // Sunday before
  });

  it("addDays handles negatives", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("todayIn converts to the user's timezone", () => {
    const lateUtc = new Date("2026-11-01T20:30:00Z"); // 03:30 on Nov 2 in Vietnam
    expect(todayIn("Asia/Ho_Chi_Minh", lateUtc)).toBe("2026-11-02");
    expect(todayIn("America/New_York", lateUtc)).toBe("2026-11-01");
    expect(todayIn("Not/AZone", lateUtc)).toBe("2026-11-01");
  });
});

import { describe, expect, it } from "vitest";
import { attendanceRate, axisMax, calendarWeeks, daySeries, level } from "./calendar";

const rows = [
  { date: "2026-03-02", lessons: 1, minutes: 30 },
  { date: "2026-03-05", lessons: 2, minutes: 60 },
  { date: "2026-03-09", lessons: 1, minutes: 15 },
];

describe("daySeries", () => {
  it("fills missing days with zeros and keeps order", () => {
    const s = daySeries(rows, "2026-03-06", 5);
    expect(s.map((d) => d.date)).toEqual(["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06"]);
    expect(s.map((d) => d.minutes)).toEqual([30, 0, 0, 60, 0]);
  });

  it("marks today and future days", () => {
    const s = daySeries(rows, "2026-03-05", 3);
    expect(s.at(-1)).toMatchObject({ date: "2026-03-05", today: true, future: false });
    expect(s.some((d) => d.future)).toBe(false);
  });
});

describe("level", () => {
  it("is 0 only when nothing was studied", () => {
    expect(level(0, 60)).toBe(0);
    expect(level(1, 60)).toBe(1);
  });

  it("splits the range into four quartiles of the busiest day", () => {
    expect(level(15, 60)).toBe(1);
    expect(level(30, 60)).toBe(2);
    expect(level(45, 60)).toBe(3);
    expect(level(60, 60)).toBe(4);
  });

  it("never exceeds 4 and survives a zero scale", () => {
    expect(level(500, 60)).toBe(4);
    expect(level(10, 0)).toBe(1);
  });
});

describe("calendarWeeks", () => {
  it("builds Monday-first weeks ending in today's week", () => {
    const { weeks } = calendarWeeks(rows, "2026-03-11", 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[0][0].date).toBe("2026-03-02"); // Monday
    expect(weeks[1][6].date).toBe("2026-03-15"); // Sunday of today's week
    expect(weeks[0].map((d) => d.minutes)).toEqual([30, 0, 0, 60, 0, 0, 0]);
  });

  it("flags days after today as future", () => {
    const { weeks } = calendarWeeks(rows, "2026-03-11", 1);
    const future = weeks[0].filter((d) => d.future).map((d) => d.date);
    expect(future).toEqual(["2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15"]);
  });

  it("reports the busiest day as the colour scale top", () => {
    expect(calendarWeeks(rows, "2026-03-11", 2).busiest).toBe(60);
  });

  it("labels a column only where the month changes", () => {
    const { months } = calendarWeeks([], "2026-03-11", 6);
    expect(months.map((m) => m.month)).toEqual(["2026-02", "2026-03"]);
    expect(months[0].column).toBe(0);
  });
});

describe("attendanceRate", () => {
  it("is 0 when no session has finished yet", () => {
    expect(attendanceRate(0, 0)).toBe(0);
  });

  it("rounds to a whole percent", () => {
    expect(attendanceRate(2, 1)).toBe(67);
    expect(attendanceRate(5, 0)).toBe(100);
  });
});

describe("axisMax", () => {
  it("rounds up to a readable step", () => {
    expect(axisMax(0)).toBe(0);
    expect(axisMax(20)).toBe(30);
    expect(axisMax(95)).toBe(120);
    expect(axisMax(301)).toBe(360);
  });
});

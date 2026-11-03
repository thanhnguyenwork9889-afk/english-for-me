import { describe, expect, it } from "vitest";
import { inQuietHours } from "./quiet-hours";

describe("inQuietHours", () => {
  it("is off without a window", () => {
    expect(inQuietHours("23:00", null, null)).toBe(false);
    expect(inQuietHours("23:00", "22:00", "22:00")).toBe(false);
  });
  it("same-day window", () => {
    expect(inQuietHours("13:30", "13:00", "14:00")).toBe(true);
    expect(inQuietHours("14:00", "13:00", "14:00")).toBe(false);
  });
  it("window across midnight", () => {
    expect(inQuietHours("23:30", "22:00", "07:00")).toBe(true);
    expect(inQuietHours("06:59", "22:00", "07:00")).toBe(true);
    expect(inQuietHours("07:00", "22:00", "07:00")).toBe(false);
    expect(inQuietHours("20:00", "22:00", "07:00")).toBe(false);
  });
});

import { quietWarning } from "./quiet-hours";

describe("quietWarning", () => {
  it("flags a window that blocks a reminder", () => {
    expect(quietWarning("23:15", "23:10", ["23:16"], 0)).toEqual({ kind: "blocks", time: "23:16" });
    // reminder fires 15 min early (20:45) inside 20:30–21:00
    expect(quietWarning("20:30", "21:00", ["21:00"], 15)).toEqual({ kind: "blocks", time: "21:00" });
  });
  it("flags very long windows", () => {
    expect(quietWarning("08:00", "23:00", ["07:00"], 0)).toEqual({ kind: "long", hours: 15 });
  });
  it("accepts a normal night window", () => {
    expect(quietWarning("22:30", "07:00", ["20:00"], 15)).toBeNull();
    expect(quietWarning("", "", ["20:00"], 15)).toBeNull();
  });
});

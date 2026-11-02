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

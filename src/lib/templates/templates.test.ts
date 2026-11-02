import { describe, expect, it } from "vitest";
import { lessonCountOf, templates } from "./index";

describe("roadmap templates", () => {
  for (const t of templates) {
    it(`${t.id} is well-formed`, () => {
      expect(t.phases.length).toBeGreaterThan(0);
      expect(lessonCountOf(t)).toBe(60);
      const titles = new Set<string>();
      for (const p of t.phases) {
        expect(p.lessons.length).toBe(10);
        for (const l of p.lessons) {
          expect(l.title.length).toBeGreaterThan(0);
          expect(l.title.length).toBeLessThanOrEqual(200); // lessons.title limit in actions
          expect(l.estimatedMinutes).toBeGreaterThan(0);
          expect(l.contentMd).toContain("🎯");
          expect(l.resourceUrls.length).toBeGreaterThan(0);
          for (const u of l.resourceUrls) expect(() => new URL(u)).not.toThrow();
          expect(titles.has(l.title)).toBe(false);
          titles.add(l.title);
        }
      }
    });
  }
});

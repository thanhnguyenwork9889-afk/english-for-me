import { describe, expect, it } from "vitest";
import { isCorrect } from "@/lib/practice/grade";
import { everydayA0ViExercises } from "./everyday-a0-vi-exercises";
import { exerciseCountOf, lessonCountOf, templates } from "./index";

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

describe("template practice questions", () => {
  const template = templates[0];
  const lessons = template.phases.flatMap((p) => p.lessons);

  it("gives every lesson at least three questions", () => {
    for (const l of lessons) {
      expect(l.exercises.length, `lesson "${l.title}" has no questions`).toBeGreaterThanOrEqual(3);
    }
    expect(exerciseCountOf(template)).toBe(lessons.length * 3);
  });

  it("has no question keyed to a lesson title that doesn't exist", () => {
    // Guards against a typo in the exercises file silently dropping a lesson's questions.
    const lessonTitles = new Set(lessons.map((l) => l.title));
    for (const key of Object.keys(everydayA0ViExercises)) {
      expect(lessonTitles.has(key), `no lesson titled "${key}"`).toBe(true);
    }
  });

  it("builds every question into a gradeable row", () => {
    for (const l of lessons) {
      l.exercises.forEach((e, i) => {
        const where = `${l.title} · Q${i + 1}`;
        expect(e.orderIndex, where).toBe(i);
        expect(e.prompt.length, where).toBeGreaterThan(5);
        expect(e.answer.trim().length, where).toBeGreaterThan(0);
        // Its own answer must grade as correct, or the question is unanswerable.
        expect(isCorrect(e.answer.split("|")[0], e.answer), where).toBe(true);
        if (e.kind === "mcq") {
          expect(e.options, where).not.toBeNull();
          expect(e.options!.length, where).toBeGreaterThanOrEqual(3);
          expect(new Set(e.options), where).toHaveLength(e.options!.length);
          expect(e.options, where).toContain(e.answer);
          // No other option may also grade as correct.
          const alsoRight = e.options!.filter((o) => o !== e.answer && isCorrect(o, e.answer));
          expect(alsoRight, where).toEqual([]);
        } else {
          expect(e.options, where).toBeNull();
        }
      });
    }
  });

  it("does not leave the right option in the same slot every time", () => {
    const mcq = lessons.flatMap((l) => l.exercises).filter((e) => e.kind === "mcq");
    const first = mcq.filter((e) => e.options![0] === e.answer).length;
    // Authored answer-first, then shuffled: roughly a third should land in slot 0.
    expect(mcq.length).toBeGreaterThan(50);
    expect(first / mcq.length).toBeLessThan(0.5);
  });
});

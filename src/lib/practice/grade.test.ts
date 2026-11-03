import { describe, expect, it } from "vitest";
import { BOX_DAYS, isCorrect, nextReview, normalize, scoreBand } from "./grade";

describe("normalize", () => {
  it("ignores case, spacing and end punctuation", () => {
    expect(normalize("  I'm   Thanh.  ")).toBe(normalize("im thanh"));
    expect(normalize("How are you?")).toBe("how are you");
  });

  it("treats curly and straight apostrophes the same", () => {
    expect(normalize("I’m fine")).toBe(normalize("I'm fine"));
  });
});

describe("isCorrect", () => {
  it("accepts a typo-free answer in any casing", () => {
    expect(isCorrect("Thank you", "thank you")).toBe(true);
    expect(isCorrect("THANK YOU!", "thank you")).toBe(true);
  });

  it("accepts any of the alternatives", () => {
    expect(isCorrect("I am fine", "I'm fine|I am fine")).toBe(true);
    expect(isCorrect("I'm fine", "I'm fine|I am fine")).toBe(true);
  });

  it("rejects a different answer", () => {
    expect(isCorrect("I are fine", "I'm fine")).toBe(false);
  });

  it("rejects an empty answer even against an empty-ish target", () => {
    expect(isCorrect("", "spell")).toBe(false);
    expect(isCorrect("   ", "spell")).toBe(false);
    expect(isCorrect("!!!", "spell")).toBe(false);
  });

  it("forgives a missing apostrophe, which is the common beginner slip", () => {
    expect(isCorrect("Im fine", "I'm fine")).toBe(true);
    expect(isCorrect("dont", "don't")).toBe(true);
  });

  it("still separates words that only punctuation held apart", () => {
    expect(isCorrect("twentyone", "twenty-one")).toBe(false);
    expect(isCorrect("twenty one", "twenty-one")).toBe(true);
  });
});

describe("nextReview", () => {
  const now = new Date("2026-03-11T10:00:00Z");
  const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / 86_400_000);

  it("sends a wrong answer back to box 0, due at once", () => {
    const r = nextReview(2, false, now);
    expect(r).toEqual({ box: 0, dueAt: now });
  });

  it("moves one box up per correct answer, with a longer gap each time", () => {
    const first = nextReview(0, true, now);
    const second = nextReview(1, true, now);
    const third = nextReview(2, true, now);
    expect(first).toMatchObject({ box: 1 });
    expect(second).toMatchObject({ box: 2 });
    expect(third).toMatchObject({ box: 3 });
    expect([first, second, third].map((r) => days((r as { dueAt: Date }).dueAt))).toEqual([...BOX_DAYS]);
  });

  it("graduates a question answered correctly from the last box", () => {
    expect(nextReview(BOX_DAYS.length, true, now)).toBe("graduated");
  });
});

describe("scoreBand", () => {
  it("calls everything right perfect", () => {
    expect(scoreBand(5, 5)).toBe("perfect");
    expect(scoreBand(0, 0)).toBe("perfect");
  });

  it("splits the rest at 60%", () => {
    expect(scoreBand(3, 5)).toBe("good");
    expect(scoreBand(2, 5)).toBe("review");
  });
});

import { describe, expect, it } from "vitest";
import { compareSpeech, digitsToWords, words } from "./compare";

const flags = (target: string, heard: string) =>
  compareSpeech(target, heard).target.map((t) => `${t.word}${t.ok ? "" : "✗"}`);

describe("digitsToWords", () => {
  it("spells out the numbers a beginner lesson teaches", () => {
    expect(digitsToWords("7")).toBe("seven");
    expect(digitsToWords("15")).toBe("fifteen");
    expect(digitsToWords("25")).toBe("twenty five");
    expect(digitsToWords("30")).toBe("thirty");
  });

  it("leaves anything it can't spell alone", () => {
    expect(digitsToWords("100")).toBe("100");
    expect(digitsToWords("hello")).toBe("hello");
  });
});

describe("words", () => {
  it("strips punctuation and apostrophes", () => {
    expect(words("I'm fine, thanks!")).toEqual(["im", "fine", "thanks"]);
  });

  it("spells digits out so speech matches the written lesson", () => {
    expect(words("I am 25 years old")).toEqual(["i", "am", "twenty", "five", "years", "old"]);
  });
});

describe("compareSpeech", () => {
  it("scores a perfect match 100", () => {
    const r = compareSpeech("How are you?", "how are you");
    expect(r.score).toBe(100);
    expect(r.band).toBe("great");
    expect(r.target.every((t) => t.ok)).toBe(true);
  });

  it("ignores case and punctuation", () => {
    expect(compareSpeech("Thank you.", "THANK YOU!").score).toBe(100);
  });

  it("marks only the words that were missed", () => {
    expect(flags("I live in Hanoi", "I live Hanoi")).toEqual(["I", "live", "in✗", "Hanoi"]);
  });

  it("charges one stumble to one word, not the whole sentence", () => {
    const r = compareSpeech("Can I have the bill please", "can I have the bill uh please");
    expect(r.score).toBe(100); // the extra word costs nothing
  });

  it("keeps a number as one token even though it compares as two words", () => {
    expect(flags("I am 25 years old", "I am twenty five years old")).toEqual(["I", "am", "25", "years", "old"]);
    expect(flags("I am 25 years old", "I am twenty years old")).toEqual(["I", "am", "25✗", "years", "old"]);
  });

  it("respects word order", () => {
    const r = compareSpeech("I am a teacher", "teacher a am I");
    expect(r.score).toBeLessThan(100);
  });

  it("scores an empty or unrelated attempt low", () => {
    expect(compareSpeech("Good morning", "").score).toBe(0);
    expect(compareSpeech("Good morning", "").band).toBe("again");
    expect(compareSpeech("Good morning", "pizza").score).toBe(0);
  });

  it("bands the score for the feedback wording", () => {
    expect(compareSpeech("one two three four", "one two three four").band).toBe("great");
    expect(compareSpeech("one two three four", "one two").band).toBe("close");
    expect(compareSpeech("one two three four", "one").band).toBe("again");
  });

  it("keeps what was heard, for the 'you said' line", () => {
    expect(compareSpeech("Hello", "  hello there ").heard).toBe("hello there");
  });
});

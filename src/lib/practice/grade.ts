// Pure grading + review scheduling. No database, no timezone math — just the rules.

/**
 * What two answers have to share to count as the same. Beginners mistype case, spacing,
 * apostrophes and end punctuation, and none of that is what a question is testing, so all
 * of it is dropped before comparing: "I'm Thanh." and "im thanh" both match "I'm Thanh".
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    // Apostrophes vanish rather than becoming a gap, so a learner who types "Im fine"
    // still matches "I'm fine". The cost: its/it's and were/we're read the same, so a
    // question about that pair belongs in an mcq, never a fill.
    .replace(/['‘’ʼ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ") // other punctuation becomes a gap
    .replace(/\s+/g, " ")
    .trim();
}

/** Accepted answers are stored in one field, separated by "|". */
export const acceptedAnswers = (answer: string) => answer.split("|").map((a) => a.trim()).filter(Boolean);

export function isCorrect(given: string, answer: string): boolean {
  const got = normalize(given);
  return got.length > 0 && acceptedAnswers(answer).some((a) => normalize(a) === got);
}

/** Days until the next review, per box. A question graduates out of the queue past the last one. */
export const BOX_DAYS = [1, 3, 7] as const;

export type NextReview = { box: number; dueAt: Date } | "graduated";

/**
 * Leitner-lite. A wrong answer sends a question back to box 0 and makes it due at once;
 * each correct answer moves it one box up, and the box after the last one graduates it
 * (the row is deleted, so the queue only ever holds what still needs work).
 */
export function nextReview(box: number, correct: boolean, now: Date = new Date()): NextReview {
  if (!correct) return { box: 0, dueAt: now };
  const next = Math.max(0, box) + 1;
  if (next > BOX_DAYS.length) return "graduated";
  const days = BOX_DAYS[next - 1];
  return { box: next, dueAt: new Date(now.getTime() + days * 24 * 3600 * 1000) };
}

/** Encouragement band for a finished practice run, so the wording matches the result. */
export function scoreBand(correct: number, total: number): "perfect" | "good" | "review" {
  if (total === 0 || correct === total) return "perfect";
  return correct / total >= 0.6 ? "good" : "review";
}

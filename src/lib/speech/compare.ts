// Pure comparison between a target sentence and what speech recognition heard.
// No browser APIs here, so the scoring rules are testable on their own.

import { normalize } from "@/lib/practice/grade";

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** "25" → "twenty five". Recognition returns digits where a lesson teaches the words. */
export function digitsToWords(token: string): string {
  const n = Number(token);
  if (!Number.isInteger(n) || n < 0 || n > 99) return token;
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones === 0 ? tens : `${tens} ${ONES[ones]}`;
}

/** Normalized, comparable words: lowercase, no punctuation, numbers spelled out. */
export function words(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter(Boolean)
    .flatMap((w) => (/^\d+$/.test(w) ? digitsToWords(w).split(" ") : [w]));
}

/** Longest common subsequence of two word lists, as the indices matched in `a`. */
function lcsIndices(a: string[], b: string[]): Set<number> {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const matched = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      matched.add(i);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return matched;
}

export type SpokenWord = { word: string; ok: boolean };

export type SpeechScore = {
  /** The target sentence's own words, each flagged as heard or missed. */
  target: SpokenWord[];
  /** What recognition heard, as written (for the "you said…" line). */
  heard: string;
  /** Percent of the target's words that came through, 0–100. */
  score: number;
  band: "great" | "close" | "again";
};

/**
 * Score an attempt word by word. Uses a longest-common-subsequence alignment, so word
 * order counts but an extra or missing word only costs that word — one stumble doesn't
 * mark the whole sentence wrong.
 */
export function compareSpeech(target: string, heard: string): SpeechScore {
  // Keep each word as written beside its normalized form: "25" compares as two words
  // ("twenty five") but must still be shown — and flagged — as the single token "25".
  const tokens = target
    .split(/\s+/)
    .filter(Boolean)
    .map((written) => ({ written, norm: words(written) }));

  const want: string[] = [];
  const ownerOf: number[] = []; // want index → token index
  tokens.forEach((token, ti) => {
    for (const w of token.norm) {
      want.push(w);
      ownerOf.push(ti);
    }
  });

  const got = words(heard);
  const matched = want.length > 0 && got.length > 0 ? lcsIndices(want, got) : new Set<number>();
  const score = want.length === 0 ? 0 : Math.round((matched.size / want.length) * 100);

  return {
    // A token counts as heard only when every word it expands to came through.
    target: tokens.map((token, ti) => ({
      word: token.written,
      ok: token.norm.length === 0 || want.every((_, wi) => ownerOf[wi] !== ti || matched.has(wi)),
    })),
    heard: heard.trim(),
    score,
    band: score >= 85 ? "great" : score >= 50 ? "close" : "again",
  };
}

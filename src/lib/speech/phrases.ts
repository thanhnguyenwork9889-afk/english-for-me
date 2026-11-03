// Pulls the "💬 Mẫu câu" list out of a lesson's notes, which is where the template
// builder writes the sentences worth hearing and saying out loud.

const HEADING = "💬";
/** A section ends at the next emoji heading the builder writes. */
const NEXT_HEADING = /^(🎯|📝|✅|💬)/u;
/** Phonetic spellings are for the eye, not for a speech engine: "sit /sɪt/" → "sit". */
const IPA = /\/[^/\n]*\//gu;

/** Speakable sentences from a lesson's notes, in order, de-duplicated. */
export function lessonPhrases(contentMd: string | null | undefined): string[] {
  if (!contentMd) return [];
  const lines = contentMd.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trimStart().startsWith(HEADING));
  if (start < 0) return [];

  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const text = line.trim();
    if (NEXT_HEADING.test(text)) break;
    if (!text.startsWith("•")) continue;
    const phrase = text.slice(1).replace(IPA, " ").replace(/\s+/g, " ").trim();
    // Needs at least one Latin letter to be worth speaking.
    if (/[a-z]/i.test(phrase) && !out.includes(phrase)) out.push(phrase);
  }
  return out;
}

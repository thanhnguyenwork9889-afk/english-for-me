import { describe, expect, it } from "vitest";
import { buildLesson } from "@/lib/templates/build";
import { templates } from "@/lib/templates";
import { lessonPhrases } from "./phrases";

const notes = [
  "🎯 Mục tiêu: Đọc đúng 26 chữ cái.",
  "",
  "📝 Cách học:",
  "1. Xem video (10')",
  "2. Đọc theo",
  "",
  "💬 Mẫu câu:",
  "• What's your name?",
  "• How do you spell that?",
  "",
  "✅ Bài tập: Ghi âm 30 giây.",
].join("\n");

describe("lessonPhrases", () => {
  it("takes only the phrase list, not the steps or the task", () => {
    expect(lessonPhrases(notes)).toEqual(["What's your name?", "How do you spell that?"]);
  });

  it("returns nothing when the lesson has no phrase section", () => {
    expect(lessonPhrases("🎯 Mục tiêu: abc\n\n✅ Bài tập: xyz")).toEqual([]);
    expect(lessonPhrases(null)).toEqual([]);
    expect(lessonPhrases("")).toEqual([]);
  });

  it("drops phonetic spellings, which a speech engine cannot read", () => {
    expect(lessonPhrases("💬 Mẫu câu:\n• sheep /ʃiːp/\n• food /fuːd/")).toEqual(["sheep", "food"]);
  });

  it("skips entries with no Latin letters left to say", () => {
    expect(lessonPhrases("💬 Mẫu câu:\n• /ʃiːp/\n• Hello")).toEqual(["Hello"]);
  });

  it("de-duplicates repeats", () => {
    expect(lessonPhrases("💬 Mẫu câu:\n• Hello\n• Hello")).toEqual(["Hello"]);
  });

  it("reads back what the template builder writes", () => {
    const built = buildLesson(
      {
        title: "t",
        goal: "g",
        steps: ["s"],
        phrases: ["Good morning.", "See you tomorrow!"],
        task: "task",
      },
      30,
    );
    expect(lessonPhrases(built.contentMd)).toEqual(["Good morning.", "See you tomorrow!"]);
  });

  it("finds phrases in most lessons of the real template", () => {
    const lessons = templates[0].phases.flatMap((p) => p.lessons);
    const withPhrases = lessons.filter((l) => lessonPhrases(l.contentMd).length > 0);
    expect(withPhrases.length / lessons.length).toBeGreaterThan(0.8);
  });
});

// Turns compact template lesson definitions into lesson rows (title, minutes, notes, links).

/**
 * Compact question input. `opts` present → multiple choice, where `a` is the index of the
 * right option; otherwise a typed answer, where `a` holds the accepted wordings
 * separated by "|". Grading ignores case, spacing, apostrophes and end punctuation, so a
 * question that turns on an apostrophe (its / it's) has to be multiple choice.
 */
export type TemplateExerciseInput =
  | { q: string; opts: string[]; a: number; why?: string }
  | { q: string; a: string; why?: string };

export type BuiltExercise = {
  kind: "mcq" | "fill";
  prompt: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  orderIndex: number;
};

/** FNV-1a, so the option order below is stable across builds (no Math.random). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Options are authored correct-answer-first for readability, which would make "pick the
 * first one" a winning strategy. Shuffling them by a hash of the question keeps the data
 * readable and the stored order unguessable — and stable, so a question doesn't reshuffle
 * between deployments.
 */
const shuffleOptions = (prompt: string, options: string[]): string[] =>
  [...options].sort((a, b) => hash(prompt + a) - hash(prompt + b));

export function buildExercise(e: TemplateExerciseInput, orderIndex: number): BuiltExercise {
  if ("opts" in e) {
    const answer = e.opts[e.a];
    if (answer === undefined) throw new Error(`exercise "${e.q}": option index ${e.a} is out of range`);
    if (new Set(e.opts).size !== e.opts.length) throw new Error(`exercise "${e.q}": duplicate options`);
    return {
      kind: "mcq",
      prompt: e.q,
      options: shuffleOptions(e.q, e.opts),
      answer,
      explanation: e.why ?? null,
      orderIndex,
    };
  }
  return { kind: "fill", prompt: e.q, options: null, answer: e.a, explanation: e.why ?? null, orderIndex };
}

export type TemplateLessonInput = {
  title: string;
  goal: string;
  steps: string[];
  phrases?: string[];
  task: string;
  /** YouTube search query for videos on this topic. */
  yt?: string;
  refs?: string[];
  minutes?: number;
  /** Practice questions for this lesson. */
  ex?: TemplateExerciseInput[];
};

export type TemplatePhaseInput = { title: string; lessons: TemplateLessonInput[] };

export type BuiltLesson = {
  title: string;
  estimatedMinutes: number;
  contentMd: string;
  resourceUrls: string[];
  exercises: BuiltExercise[];
};

export const youtubeSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export function buildLesson(l: TemplateLessonInput, defaultMinutes: number): BuiltLesson {
  const parts = [
    `🎯 Mục tiêu: ${l.goal}`,
    `📝 Cách học:\n${l.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    l.phrases?.length ? `💬 Mẫu câu:\n${l.phrases.map((p) => `• ${p}`).join("\n")}` : null,
    `✅ Bài tập: ${l.task}`,
  ].filter(Boolean);

  return {
    title: l.title,
    estimatedMinutes: l.minutes ?? defaultMinutes,
    contentMd: parts.join("\n\n"),
    resourceUrls: [...(l.yt ? [youtubeSearch(l.yt)] : []), ...(l.refs ?? [])],
    exercises: (l.ex ?? []).map(buildExercise),
  };
}

// Turns compact template lesson definitions into lesson rows (title, minutes, notes, links).

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
};

export type TemplatePhaseInput = { title: string; lessons: TemplateLessonInput[] };

export type BuiltLesson = { title: string; estimatedMinutes: number; contentMd: string; resourceUrls: string[] };

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
  };
}

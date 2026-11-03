/** Is local "HH:MM" inside [start, end)? Handles windows that cross midnight (22:00–07:00). */
export function inQuietHours(now: string, start: string | null, end: string | null): boolean {
  if (!start || !end || start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export type QuietWarning = { kind: "long"; hours: number } | { kind: "blocks"; time: string } | null;

/**
 * Explain why a do-not-disturb window would swallow reminders: it blocks the moment a
 * scheduled reminder fires (study time − remindBefore), or it covers more than 12 hours.
 */
export function quietWarning(
  start: string,
  end: string,
  studyTimes: string[],
  remindBeforeMinutes: number,
): QuietWarning {
  if (!start || !end || start === end) return null;
  for (const t of studyTimes) {
    if (inQuietHours(fromMin(toMin(t) - remindBeforeMinutes), start, end)) return { kind: "blocks", time: t };
  }
  const length = (toMin(end) - toMin(start) + 1440) % 1440;
  if (length > 12 * 60) return { kind: "long", hours: Math.round(length / 6) / 10 };
  return null;
}

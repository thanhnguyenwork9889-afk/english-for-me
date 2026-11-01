/** Hours per week needed to finish `totalMinutes` of work by `targetDate` (ISO). */
export function hoursPerWeekNeeded(
  totalMinutes: number,
  targetDate: string | null,
  now: Date = new Date(),
): { kind: "none" } | { kind: "overdue" } | { kind: "ok"; hours: number } {
  if (!targetDate || totalMinutes <= 0) return { kind: "none" };
  const end = new Date(`${targetDate}T23:59:59Z`).getTime();
  const msLeft = end - now.getTime();
  if (msLeft <= 0) return { kind: "overdue" };
  const weeks = Math.max(msLeft / (7 * 24 * 3600 * 1000), 1 / 7);
  return { kind: "ok", hours: Math.round((totalMinutes / 60 / weeks) * 10) / 10 };
}

export const minutesToHours = (m: number) => Math.round((m / 60) * 10) / 10;

export const todayIso = () => new Date().toISOString().slice(0, 10);

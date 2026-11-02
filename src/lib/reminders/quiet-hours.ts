/** Is local "HH:MM" inside [start, end)? Handles windows that cross midnight (22:00–07:00). */
export function inQuietHours(now: string, start: string | null, end: string | null): boolean {
  if (!start || !end || start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

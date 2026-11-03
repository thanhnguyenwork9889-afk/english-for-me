// Sequential indigo ramp for the progress charts: one hue, more-is-further-from-the-surface.
// Both modes are chosen separately (dark is not an automatic flip) and both pass the
// ordinal palette gate — monotone lightness, >= 0.06 lightness gaps between steps, and the
// step nearest the surface above 2:1 contrast (light 2.17:1 on #fff, dark 2.38:1 on #0a0a0a).

/** Level 0 (nothing studied) → 4 (busiest). Index with `level()` from lib/stats/calendar. */
export const fillByLevel = [
  "bg-black/[0.06] dark:bg-white/[0.07]",
  "bg-[#9bacfb] dark:bg-[#423ab8]",
  "bg-[#7d89f8] dark:bg-[#5a52ec]",
  "bg-[#5b55ea] dark:bg-[#8b93f8]",
  "bg-[#3f35b8] dark:bg-[#c0c8fe]",
] as const;

/** A day with no data yet (still in the future) — lighter than "studied nothing". */
export const fillFuture = "bg-black/[0.02] dark:bg-white/[0.03]";

/** Single-series bar fill: the ramp's mid step, so one bar reads the same in both modes. */
export const fillBar = "bg-[#5b55ea] dark:bg-[#8b93f8]";

/** Hairline gridline / baseline, one step off the surface. */
export const gridline = "border-black/10 dark:border-white/15";

export const tooltipCls =
  "pointer-events-none absolute bottom-full z-20 mb-1.5 hidden whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block group-focus-within:block dark:bg-zinc-100 dark:text-zinc-900";

/** Keep a tooltip inside the chart: centre it, except near either edge. */
export function tooltipAlign(index: number, count: number): string {
  if (index <= 1) return "left-0";
  if (index >= count - 2) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

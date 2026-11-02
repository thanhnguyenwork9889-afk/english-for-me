/**
 * Meter: a single ratio against a whole. Fill and track come from the same hue
 * (indigo-600 on indigo-100) so the bar reads as one thing; text stays in text colors.
 */
export function ProgressMeter({
  value,
  max,
  label,
  size = "md",
  className = "",
}: {
  value: number;
  max: number;
  /** Accessible name, e.g. "3/5 lessons done". */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const done = max > 0 && value >= max;
  const height = size === "sm" ? "h-1" : "h-2";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      title={label}
      className={`${height} w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-500/20 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          done ? "bg-emerald-500" : "bg-indigo-600 dark:bg-indigo-400"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const percent = (value: number, max: number) => (max > 0 ? Math.round((value / max) * 100) : 0);

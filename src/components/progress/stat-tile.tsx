/** Stat tile: label · value · optional caption (and optional meter below). Text stays in text colors. */
export function StatTile({
  icon,
  label,
  value,
  caption,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
      <p className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        <span aria-hidden>{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {caption && <p className="mt-0.5 text-xs text-zinc-500">{caption}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

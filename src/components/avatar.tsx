/** Round avatar: photo if available, otherwise initials on a colored circle. */
export function Avatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small user-uploaded image from Supabase Storage
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

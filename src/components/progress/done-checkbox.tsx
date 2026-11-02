"use client";

/** Round check button used on lesson rows. Purely presentational; parent decides what a click does. */
export function DoneCheckbox({
  checked,
  pending,
  label,
  onClick,
}: {
  checked: boolean;
  pending?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={onClick}
      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors disabled:opacity-50 ${
        checked
          ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
          : "border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-600"
      }`}
    >
      <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
        <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

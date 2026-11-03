"use client";

import { canSpeak, say } from "@/lib/speech/browser";
import { useSupport } from "./use-support";

/**
 * Reads a phrase aloud with the browser's own voice. Renders nothing where the browser
 * has no speech synthesis, rather than offering a button that does nothing.
 */
export function SpeakButton({
  text,
  label,
  slowLabel,
  withSlow = true,
}: {
  text: string;
  label: string;
  slowLabel: string;
  /** Also show the 🐢 slow button (0.6× rate). */
  withSlow?: boolean;
}) {
  // False on the server and on the first paint, so the markup matches; true after hydration.
  const supported = useSupport(canSpeak);
  if (!supported) return null;

  const cls =
    "grid size-8 shrink-0 place-items-center rounded-lg text-base hover:bg-black/5 active:scale-95 dark:hover:bg-white/10";

  return (
    <span className="inline-flex items-center gap-0.5">
      <button type="button" className={cls} aria-label={`${label}: ${text}`} title={label} onClick={() => say(text, 1)}>
        <span aria-hidden>🔊</span>
      </button>
      {withSlow && (
        <button
          type="button"
          className={cls}
          aria-label={`${slowLabel}: ${text}`}
          title={slowLabel}
          onClick={() => say(text, 0.6)}
        >
          <span aria-hidden>🐢</span>
        </button>
      )}
    </span>
  );
}

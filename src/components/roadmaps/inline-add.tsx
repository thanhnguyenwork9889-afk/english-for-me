"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/roadmaps/actions";
import { btnGhost, btnPrimary, inputCls } from "@/components/ui";

/** "+ Add something" button that expands into a one-line input. */
export function InlineAdd({
  label,
  placeholder,
  cancelLabel,
  errorLabel,
  onAdd,
  variant = "ghost",
}: {
  label: string;
  placeholder: string;
  cancelLabel: string;
  errorLabel: string;
  onAdd: (title: string) => Promise<ActionResult>;
  variant?: "ghost" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        className={variant === "primary" ? btnPrimary : `${btnGhost} w-full justify-start text-zinc-500`}
        onClick={() => setOpen(true)}
      >
        + {label}
      </button>
    );
  }

  function submit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    setError(false);
    startTransition(async () => {
      const res = await onAdd(title);
      if (!res.ok) return setError(true);
      // Keep the input open for quick successive adds.
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
    });
  }

  return (
    <form action={submit} className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        ref={inputRef}
        name="title"
        autoFocus
        required
        maxLength={200}
        placeholder={placeholder}
        className={inputCls}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <div className="flex shrink-0 gap-2">
        <button type="submit" className={btnPrimary} disabled={pending}>{label}</button>
        <button type="button" className={btnGhost} onClick={() => setOpen(false)}>{cancelLabel}</button>
      </div>
      {error && <p className="text-sm text-red-600">{errorLabel}</p>}
    </form>
  );
}

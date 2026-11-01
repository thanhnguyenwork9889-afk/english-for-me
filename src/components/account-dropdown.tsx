"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth-actions";
import { Avatar } from "./avatar";

type Item = { href: string; label: string; mobileOnly?: boolean };

/** Avatar button that opens a small account menu. Closes on outside click, Esc, or navigation. */
export function AccountDropdown({
  name,
  email,
  avatarUrl,
  items,
  lang,
  menuLabel,
  logoutLabel,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  items: Item[];
  lang: string;
  menuLabel: string;
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls =
    "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 ring-indigo-500/40 hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar src={avatarUrl} name={name} size={32} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-black/10 bg-background p-1.5 shadow-lg dark:border-white/15"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar src={avatarUrl} name={name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-zinc-500">{email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-black/5 dark:bg-white/10" />
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`${itemCls} ${it.mobileOnly ? "sm:hidden" : ""}`}
            >
              {it.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-black/5 dark:bg-white/10" />
          <form action={signOut}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" role="menuitem" className={`${itemCls} text-red-600`}>
              {logoutLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

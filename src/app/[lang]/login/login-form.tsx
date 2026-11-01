"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ lang, t }: { lang: string; t: Dictionary["login"] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
        {t.sent}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      <label className="block">
        <span className="text-sm font-medium">{t.emailLabel}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          className="mt-1 block h-11 w-full rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/15"
        />
      </label>
      {state.status === "invalid" && <p className="text-sm text-red-600">{t.invalidEmail}</p>}
      {state.status === "error" && <p className="text-sm text-red-600">{t.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}

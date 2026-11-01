"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthState,
} from "@/lib/auth-actions";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

type Mode = "login" | "signup" | "forgot" | "reset";
const actions = { login: signIn, signup: signUp, forgot: requestPasswordReset, reset: updatePassword };

export function AuthForm({ mode, lang, t }: { mode: Mode; lang: string; t: Dictionary["auth"] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(actions[mode], {});
  const [showPw, setShowPw] = useState(false);

  const submitLabel = {
    login: t.login.submit,
    signup: t.signup.submit,
    forgot: t.forgot.submit,
    reset: t.reset.submit,
  }[mode];

  if (state.notice) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t.notices[state.notice]}
        </p>
        <Link href={`/${lang}/login`} className="block text-center text-sm font-medium text-indigo-600 hover:underline">
          {t.forgot.back}
        </Link>
      </div>
    );
  }

  const pwType = showPw ? "text" : "password";
  const needsEmail = mode !== "reset";
  const needsPassword = mode !== "forgot";
  const newPassword = mode === "signup" || mode === "reset";

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <input type="hidden" name="lang" value={lang} />

      {mode === "signup" && (
        <div>
          <label className={labelCls} htmlFor="name">{t.name}</label>
          <input id="name" name="name" autoComplete="name" maxLength={100} placeholder={t.namePlaceholder} className={inputCls} />
        </div>
      )}

      {needsEmail && (
        <div>
          <label className={labelCls} htmlFor="email">{t.email}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus={mode !== "signup"}
            placeholder={t.emailPlaceholder}
            className={inputCls}
          />
        </div>
      )}

      {needsPassword && (
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              {mode === "reset" ? t.newPassword : t.password}
            </label>
            {mode === "login" && (
              <Link href={`/${lang}/forgot-password`} className="text-xs text-indigo-600 hover:underline">
                {t.login.forgot}
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={pwType}
              required
              minLength={newPassword ? 8 : undefined}
              maxLength={72}
              autoComplete={newPassword ? "new-password" : "current-password"}
              autoFocus={mode === "reset"}
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t.hidePassword : t.showPassword}
              title={showPw ? t.hidePassword : t.showPassword}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
          {newPassword && <p className="mt-1 text-xs text-zinc-500">{t.passwordHint}</p>}
        </div>
      )}

      {newPassword && (
        <div>
          <label className={labelCls} htmlFor="confirm">{t.confirmPassword}</label>
          <input
            id="confirm"
            name="confirm"
            type={pwType}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {t.errors[state.error]}
          {state.error === "sessionExpired" && (
            <>
              {" "}
              <Link href={`/${lang}/forgot-password`} className="underline">{t.forgot.submit}</Link>
            </>
          )}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${btnPrimary} h-11 w-full`}>
        {pending ? t.pending : submitLabel}
      </button>

      {mode === "login" && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t.login.noAccount}{" "}
          <Link href={`/${lang}/signup`} className="font-medium text-indigo-600 hover:underline">{t.login.signupLink}</Link>
        </p>
      )}
      {mode === "signup" && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t.signup.hasAccount}{" "}
          <Link href={`/${lang}/login`} className="font-medium text-indigo-600 hover:underline">{t.signup.loginLink}</Link>
        </p>
      )}
      {mode === "forgot" && (
        <Link href={`/${lang}/login`} className="block text-center text-sm font-medium text-indigo-600 hover:underline">
          ← {t.forgot.back}
        </Link>
      )}
    </form>
  );
}

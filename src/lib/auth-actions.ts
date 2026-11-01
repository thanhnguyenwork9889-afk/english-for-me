"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type AuthError =
  | "invalid"
  | "invalidCredentials"
  | "emailTaken"
  | "weakPassword"
  | "passwordMismatch"
  | "emailNotConfirmed"
  | "rateLimited"
  | "sessionExpired"
  | "emailInvalid"
  | "signupDisabled"
  | "emailSendFailed"
  | "server";

export type AuthState = { error?: AuthError; notice?: "checkEmail" | "resetSent" };

const MIN_PASSWORD = 8;
const email = z.email().max(254);
const password = z.string().min(MIN_PASSWORD).max(72);

function langOf(formData: FormData): Locale {
  const raw = String(formData.get("lang") ?? "");
  return hasLocale(raw) ? raw : defaultLocale;
}

async function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
}

/** Map Supabase auth error codes to our UI error keys. */
function mapError(code: string | undefined, fallback: AuthError = "server", detail?: unknown): AuthError {
  if (detail) console.error("[auth]", code, detail instanceof Error ? detail.message : detail);
  // Supabase's built-in mailer only delivers to project team members, a few emails per hour.
  if (code === "email_address_not_authorized" || /sending .*email/i.test(String((detail as Error)?.message ?? ""))) {
    return "emailSendFailed";
  }
  switch (code) {
    case "email_address_invalid":
      return "emailInvalid";
    case "signup_disabled":
    case "email_provider_disabled":
      return "signupDisabled";
    case "invalid_credentials":
      return "invalidCredentials";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "weakPassword";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    case "session_not_found":
    case "session_expired":
      return "sessionExpired";
    default:
      return fallback;
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const lang = langOf(formData);
  const parsed = z
    .object({ email, password: z.string().min(1).max(72) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: mapError(error.code, "invalidCredentials", error) };

  redirect(`/${lang}/dashboard`);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const lang = langOf(formData);
  const parsed = z
    .object({
      name: z.string().trim().max(100),
      email,
      password,
      confirm: z.string(),
    })
    .safeParse({
      name: formData.get("name") ?? "",
      email: formData.get("email"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
  if (!parsed.success) {
    const pwIssue = parsed.error.issues.some((i) => i.path[0] === "password");
    return { error: pwIssue ? "weakPassword" : "invalid" };
  }
  if (parsed.data.password !== parsed.data.confirm) return { error: "passwordMismatch" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name || null, locale: lang },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/${lang}/dashboard`,
    },
  });
  if (error) return { error: mapError(error.code, "server", error) };

  // "Confirm email" disabled in Supabase → we get a session immediately.
  if (data.session) redirect(`/${lang}/dashboard`);
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) return { error: "emailTaken" };
  return { notice: "checkEmail" };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const lang = langOf(formData);
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/${lang}/reset-password`,
  });
  // Don't reveal whether the email exists; only surface rate limiting.
  if (error && mapError(error.code) === "rateLimited") return { error: "rateLimited" };
  if (error) console.error("[requestPasswordReset]", error.code, error.message);
  return { notice: "resetSent" };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const lang = langOf(formData);
  const parsed = z
    .object({ password, confirm: z.string() })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: "weakPassword" };
  if (parsed.data.password !== parsed.data.confirm) return { error: "passwordMismatch" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    // No session = the reset link was never opened or has expired.
    if (error.name === "AuthSessionMissingError") return { error: "sessionExpired" };
    return { error: mapError(error.code, "server", error) };
  }

  redirect(`/${lang}/dashboard`);
}

export async function signOut(formData: FormData) {
  const lang = langOf(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${lang}`);
}

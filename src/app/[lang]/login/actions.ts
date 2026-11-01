"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "invalid" | "error" };

const schema = z.object({
  email: z.email(),
  lang: z.string(),
});

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    lang: formData.get("lang"),
  });
  if (!parsed.success) return { status: "invalid" };

  const lang = hasLocale(parsed.data.lang) ? parsed.data.lang : defaultLocale;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/${lang}/dashboard`,
    },
  });

  if (error) {
    console.error("[sendMagicLink]", error.message);
    return { status: "error" };
  }
  return { status: "sent" };
}

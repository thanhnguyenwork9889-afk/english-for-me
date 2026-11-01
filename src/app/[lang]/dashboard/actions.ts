"use server";

import { redirect } from "next/navigation";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function signOut(formData: FormData) {
  const raw = String(formData.get("lang") ?? "");
  const lang = hasLocale(raw) ? raw : defaultLocale;
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${lang}`);
}

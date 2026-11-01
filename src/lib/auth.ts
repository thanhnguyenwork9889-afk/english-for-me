import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Authenticated user's id (Supabase `sub` claim), or null. Reads cookies: request-time only. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function getUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  return typeof email === "string" ? email : null;
}

/** For pages: redirect to login when signed out. */
export async function requireUserId(lang: string): Promise<string> {
  const id = await getUserId();
  if (!id) redirect(`/${lang}/login`);
  return id;
}

/** For Server Actions: throw when signed out. */
export async function requireUserIdForAction(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

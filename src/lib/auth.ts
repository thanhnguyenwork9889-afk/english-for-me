import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Verified JWT claims for the current request (deduped per render).
 * `connection()` first: Supabase checks token expiry with the current time, which must
 * never run during prerender/prefetch — otherwise a prefetched page can render as
 * "signed out" and send the user to the login page when they click a menu link.
 */
const getClaims = cache(async () => {
  await connection();
  return readClaims();
});

async function readClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

/** Authenticated user's id (Supabase `sub` claim), or null. Request-time only. */
export async function getUserId(): Promise<string | null> {
  const sub = (await getClaims())?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function getUserEmail(): Promise<string | null> {
  const email = (await getClaims())?.email;
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
  const id = (await readClaims())?.sub;
  if (typeof id !== "string") throw new Error("Unauthorized");
  return id;
}

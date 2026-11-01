import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // Safe to ignore because proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}

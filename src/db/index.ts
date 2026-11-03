import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Server-side DB access (bypasses RLS: always filter by the authenticated user's id).
// `prepare: false` is required for Supabase's transaction pooler (port 6543).
//
// The pool is kept small and short-lived on purpose: on Vercel every serverless instance
// opens its own pool against the same pooler, so a large `max` per instance multiplies
// into pooler slots nobody is using. `idle_timeout` hands those back instead of holding
// them until the instance is recycled.
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 5,
  idle_timeout: 20, // seconds
});

export const db = drizzle(client, { schema });
export { schema };

import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Server-side DB access (bypasses RLS: always filter by the authenticated user's id).
// `prepare: false` is required for Supabase's transaction pooler (port 6543).
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };

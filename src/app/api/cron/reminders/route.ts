import { timingSafeEqual } from "node:crypto";
import { runReminders } from "@/lib/reminders/run";

/**
 * Called every minute by Supabase pg_cron (see supabase/04_reminders_cron.sql) with
 * `Authorization: Bearer <CRON_SECRET>`.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await runReminders();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/reminders]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;

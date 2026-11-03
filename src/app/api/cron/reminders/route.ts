import { timingSafeEqual } from "node:crypto";
import { runReminders } from "@/lib/reminders/run";
import { sendWeeklyReports } from "@/lib/supervisor/weekly-push";

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
    // Reminders first: they are time-critical, the weekly summary is not. Run in sequence
    // so a slow weekly report can never delay a session reminder.
    const reminders = await runReminders();
    const weekly = await sendWeeklyReports();
    return Response.json({ ok: true, ...reminders, weekly });
  } catch (e) {
    console.error("[cron/reminders]", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;

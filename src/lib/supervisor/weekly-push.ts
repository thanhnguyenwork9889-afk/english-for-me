import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { format } from "@/i18n/config";
import en from "@/i18n/dictionaries/en.json";
import vi from "@/i18n/dictionaries/vi.json";
import { sendPushToUser } from "@/lib/push/send";
import { inQuietHours } from "@/lib/reminders/quiet-hours";
import { getSupervisorFacts } from "./queries";
import { weeklyReport } from "./rules";

/** `db` or a transaction, so a test can run a tick and roll it back. */
type Executor = Pick<typeof db, "execute" | "update">;

type Claimed = {
  notification_id: string;
  user_id: string;
  locale: string;
  local_now: string;
  quiet_start: string | null;
  quiet_end: string | null;
};

export type WeeklyPushResult = { claimed: number; sent: number; skipped: number };

/** Monday morning, in the learner's own timezone. */
const SEND_HOUR = 8;

/**
 * Sends each learner one summary of the week just gone, on Monday morning.
 *
 * The notification row is written *before* the push as a claim: a partial unique index on
 * (user_id, scheduled_for) for this type means a second cron tick in the same hour — or an
 * overlapping run — inserts nothing and sends nothing.
 */
export async function sendWeeklyReports(exec: Executor = db): Promise<WeeklyPushResult> {
  const claimed = (await exec.execute(sql`
    with eligible as (
      select us.user_id, us.locale, us.quiet_hours_start, us.quiet_hours_end,
             (now() at time zone us.timezone)::date as local_date,
             to_char(now() at time zone us.timezone, 'HH24:MI') as local_now
      from user_settings us
      where us.push_enabled
        and extract(isodow from (now() at time zone us.timezone)) = 1
        and extract(hour from (now() at time zone us.timezone)) = ${SEND_HOUR}
    ),
    claim as (
      insert into notifications (user_id, type, channel, scheduled_for, status)
      select user_id, 'weekly_report', 'push', local_date, 'pending' from eligible
      on conflict do nothing
      returning id, user_id
    )
    select c.id as notification_id, c.user_id, e.locale, e.local_now,
           to_char(e.quiet_hours_start, 'HH24:MI') as quiet_start,
           to_char(e.quiet_hours_end, 'HH24:MI') as quiet_end
    from claim c
    join eligible e on e.user_id = c.user_id
  `)) as unknown as Claimed[];

  let sent = 0;
  let skipped = 0;

  for (const row of claimed) {
    const dict = row.locale === "en" ? en : vi;
    const w = dict.supervisor.weekly;

    if (inQuietHours(row.local_now, row.quiet_start, row.quiet_end)) {
      skipped++;
      await exec
        .update(notifications)
        .set({ title: w.pushTitle, body: "skipped_quiet_hours", status: "skipped_quiet_hours" })
        .where(eq(notifications.id, row.notification_id));
      continue;
    }

    const report = weeklyReport(await getSupervisorFacts(row.user_id));
    const headline = (w.headlines as Record<string, string | undefined>)[report.headline.kind] ?? "";
    const payload = {
      title: w.pushTitle,
      body: `${format(w.pushBody, {
        minutes: report.minutes,
        lessons: report.lessons,
        percent: report.goalPercent,
      })}\n${headline}`,
      url: `/${row.locale === "en" ? "en" : "vi"}/progress`,
      tag: `weekly-${row.notification_id}`,
    };

    const res = await sendPushToUser(row.user_id, payload);
    if (res.sent > 0) sent++;
    await exec
      .update(notifications)
      .set({
        title: payload.title,
        body: payload.body,
        status: res.sent > 0 ? "sent" : "failed",
        sentAt: res.sent > 0 ? new Date() : null,
      })
      .where(eq(notifications.id, row.notification_id));
  }

  return { claimed: claimed.length, sent, skipped };
}

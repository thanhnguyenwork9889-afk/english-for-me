import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { sendPushToUser } from "@/lib/push/send";
import { remainingLessons } from "@/lib/schedule/queries";
import { inQuietHours } from "./quiet-hours";

type DueRow = {
  session_id: string;
  user_id: string;
  roadmap_id: string;
  roadmap_title: string;
  duration_min: number;
  local_time: string; // "HH:MM" in the user's timezone
  local_now: string; // "HH:MM"
  locale: string;
  quiet_start: string | null;
  quiet_end: string | null;
  studied_today: boolean;
};

/** `db` or a transaction — lets tests run a tick inside a rolled-back transaction. */
type Executor = Pick<typeof db, "execute" | "insert">;

export type ReminderRunResult = {
  materialized: number;
  due: number;
  sent: number;
  skipped: number;
  followups: number;
  closed: number;
};

/**
 * One tick of the reminder loop (meant to run every minute):
 *  1. materialise today's + tomorrow's sessions from active schedules (idempotent)
 *  2. atomically claim sessions whose reminder time has come and push a notification
 *  3. close sessions that ended 2h+ ago as done / missed
 */
export async function runReminders(exec: Executor = db): Promise<ReminderRunResult> {
  // 1. Materialise. `local date + time AT TIME ZONE tz` gives the correct instant, DST included.
  const materialized = await exec.execute(sql`
    insert into study_sessions (user_id, schedule_id, scheduled_at, duration_min)
    select s.user_id, s.id, ((d.day + s.start_time) at time zone coalesce(us.timezone, 'Asia/Ho_Chi_Minh')), s.duration_min
    from study_schedules s
    join roadmaps r on r.id = s.roadmap_id and r.status = 'active'
    left join user_settings us on us.user_id = s.user_id
    cross join lateral (
      select ((now() at time zone coalesce(us.timezone, 'Asia/Ho_Chi_Minh'))::date + k) as day
      from generate_series(0, 1) as k
    ) d
    where s.active
      and extract(isodow from d.day)::int = any(s.days_of_week)
    on conflict (schedule_id, scheduled_at) do nothing
  `);

  // 2. Claim due sessions in one UPDATE … RETURNING so overlapping runs never double-send.
  const due = (await exec.execute(sql`
    with claimed as (
      update study_sessions ss
      set reminded_at = now()
      from study_schedules s, user_settings us
      where s.id = ss.schedule_id
        and us.user_id = ss.user_id
        and ss.status = 'upcoming'
        and ss.reminded_at is null
        and us.push_enabled
        and now() >= ss.scheduled_at - make_interval(mins => us.remind_before_minutes)
        and now() <  ss.scheduled_at + interval '15 minutes'
      returning ss.id, ss.user_id, s.roadmap_id, ss.scheduled_at, ss.duration_min,
                us.timezone, us.locale, us.quiet_hours_start, us.quiet_hours_end
    )
    select c.id as session_id, c.user_id, c.roadmap_id, r.title as roadmap_title, c.duration_min,
           to_char(c.scheduled_at at time zone c.timezone, 'HH24:MI') as local_time,
           to_char(now() at time zone c.timezone, 'HH24:MI') as local_now,
           c.locale,
           to_char(c.quiet_hours_start, 'HH24:MI') as quiet_start,
           to_char(c.quiet_hours_end, 'HH24:MI') as quiet_end,
           exists (
             select 1 from lesson_progress lp
             where lp.user_id = c.user_id and lp.status = 'completed'
               and (lp.completed_at at time zone c.timezone)::date = (now() at time zone c.timezone)::date
           ) as studied_today
    from claimed c
    join roadmaps r on r.id = c.roadmap_id
  `)) as unknown as DueRow[];

  let sent = 0;
  let skipped = 0;
  for (const row of due) {
    const skipReason = row.studied_today
      ? "skipped_studied_today"
      : inQuietHours(row.local_now, row.quiet_start, row.quiet_end)
        ? "skipped_quiet_hours"
        : null;
    if (skipReason) {
      skipped++;
      // Keep a trace so "why didn't I get a reminder?" can be answered later.
      await exec.insert(notifications).values({
        userId: row.user_id,
        type: "reminder",
        channel: "push",
        title: `${row.local_time} – ${row.roadmap_title}`,
        body: skipReason,
        refId: row.session_id,
        status: skipReason,
      });
      continue;
    }
    const vi = row.locale !== "en";
    const [next] = await remainingLessons(row.user_id, row.roadmap_id);
    const lessonPart = next ? `${next.title} (${next.estimatedMinutes} ${vi ? "phút" : "min"})` : row.roadmap_title;
    const payload = {
      title: vi ? `⏰ ${row.local_time} – Đến giờ học rồi!` : `⏰ ${row.local_time} – Time to study!`,
      body: vi ? `Bài hôm nay: ${lessonPart}` : `Today's lesson: ${lessonPart}`,
      url: `/${vi ? "vi" : "en"}/roadmaps/${row.roadmap_id}`,
      tag: `session-${row.session_id}`,
      sticky: true,
    };
    const res = await sendPushToUser(row.user_id, payload);
    if (res.sent > 0) sent++;
    await exec.insert(notifications).values({
      userId: row.user_id,
      type: "reminder",
      channel: "push",
      title: payload.title,
      body: payload.body,
      refId: row.session_id,
      status: res.sent > 0 ? "sent" : "failed",
      sentAt: res.sent > 0 ? new Date() : null,
    });
  }

  // 2b. Follow-up: 30 min after a session started, nudge once more if nothing was studied today.
  // Only for sessions whose first reminder actually went out (so quiet-hours skips stay quiet).
  const followups = (await exec.execute(sql`
    with claimed as (
      update study_sessions ss
      set followup_at = now()
      from study_schedules s, user_settings us
      where s.id = ss.schedule_id
        and us.user_id = ss.user_id
        and ss.status = 'upcoming'
        and ss.reminded_at is not null
        and ss.followup_at is null
        and us.push_enabled and us.followup_enabled
        and now() >= ss.scheduled_at + interval '30 minutes'
        and now() <  ss.scheduled_at + interval '45 minutes'
        and exists (select 1 from notifications n where n.ref_id = ss.id and n.type = 'reminder' and n.status = 'sent')
      returning ss.id, ss.user_id, s.roadmap_id, us.timezone, us.locale, us.quiet_hours_start, us.quiet_hours_end
    )
    select c.id as session_id, c.user_id, c.roadmap_id, r.title as roadmap_title, c.locale,
           to_char(now() at time zone c.timezone, 'HH24:MI') as local_now,
           to_char(c.quiet_hours_start, 'HH24:MI') as quiet_start,
           to_char(c.quiet_hours_end, 'HH24:MI') as quiet_end,
           exists (
             select 1 from lesson_progress lp
             where lp.user_id = c.user_id and lp.status = 'completed'
               and (lp.completed_at at time zone c.timezone)::date = (now() at time zone c.timezone)::date
           ) as studied_today
    from claimed c
    join roadmaps r on r.id = c.roadmap_id
  `)) as unknown as Omit<DueRow, "duration_min" | "local_time">[];

  let followed = 0;
  for (const row of followups) {
    if (row.studied_today || inQuietHours(row.local_now, row.quiet_start, row.quiet_end)) continue;
    const vi = row.locale !== "en";
    const [next] = await remainingLessons(row.user_id, row.roadmap_id);
    const payload = {
      title: vi ? "🔔 Bạn chưa học hôm nay" : "🔔 You haven't studied yet today",
      body: vi
        ? `Chỉ cần ${next?.estimatedMinutes ?? 30} phút để giữ chuỗi ngày học 🔥 ${next ? `· ${next.title}` : ""}`
        : `Just ${next?.estimatedMinutes ?? 30} minutes keeps your streak alive 🔥 ${next ? `· ${next.title}` : ""}`,
      url: `/${vi ? "vi" : "en"}/roadmaps/${row.roadmap_id}`,
      tag: `session-${row.session_id}`,
      sticky: true,
    };
    const res = await sendPushToUser(row.user_id, payload);
    if (res.sent > 0) followed++;
    await exec.insert(notifications).values({
      userId: row.user_id,
      type: "followup",
      channel: "push",
      title: payload.title,
      body: payload.body,
      refId: row.session_id,
      status: res.sent > 0 ? "sent" : "failed",
      sentAt: res.sent > 0 ? new Date() : null,
    });
  }

  // 3. Close finished sessions: done if any lesson was completed that local day, else missed.
  const closed = await exec.execute(sql`
    update study_sessions ss
    set status = case when exists (
          select 1 from lesson_progress lp
          where lp.user_id = ss.user_id and lp.status = 'completed'
            and (lp.completed_at at time zone coalesce(us.timezone, 'Asia/Ho_Chi_Minh'))::date
              = (ss.scheduled_at at time zone coalesce(us.timezone, 'Asia/Ho_Chi_Minh'))::date
        ) then 'done' else 'missed' end
    from user_settings us
    where us.user_id = ss.user_id
      and ss.status = 'upcoming'
      and now() > ss.scheduled_at + make_interval(mins => ss.duration_min) + interval '2 hours'
  `);

  return {
    materialized: rowCount(materialized),
    due: due.length,
    sent,
    skipped,
    followups: followed,
    closed: rowCount(closed),
  };
}

function rowCount(result: unknown): number {
  const r = result as { count?: number; rowCount?: number };
  return r.count ?? r.rowCount ?? 0;
}

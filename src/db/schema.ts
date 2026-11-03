import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ========== USER ==========
// `id` equals auth.users.id (populated by the trigger in supabase/policies.sql).
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  locale: text("locale").notNull().default("vi"), // vi | en
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  weeklyGoalMinutes: integer("weekly_goal_minutes").notNull().default(300),
  remindBeforeMinutes: integer("remind_before_minutes").notNull().default(15),
  // Second nudge ~30 min after the session starts if nothing was studied yet.
  followupEnabled: boolean("followup_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  aiTone: text("ai_tone").notNull().default("friendly"), // friendly | strict | coach
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
});

// ========== ROADMAP / TASK ==========
export const roadmaps = pgTable("roadmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  goal: text("goal"),
  startDate: date("start_date").notNull(),
  targetDate: date("target_date"),
  status: text("status").notNull().default("active"), // active | paused | completed | archived
  createdAt: createdAt(),
}, (t) => [index("roadmaps_user_idx").on(t.userId)]);

export const phases = pgTable("phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  roadmapId: uuid("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  targetDate: date("target_date"),
}, (t) => [index("phases_roadmap_idx").on(t.roadmapId)]);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  phaseId: uuid("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  contentMd: text("content_md"),
  resourceUrls: text("resource_urls").array(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  orderIndex: integer("order_index").notNull(),
  createdAt: createdAt(),
}, (t) => [index("lessons_phase_idx").on(t.phaseId)]);

// ========== PRACTICE ==========
// Questions attached to a lesson. The answer never leaves the server: grading happens
// in a server action, so the client only ever sees prompt + options.
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // mcq (pick an option) | fill (type the answer)
  prompt: text("prompt").notNull(),
  options: text("options").array(), // mcq only
  /** mcq: the correct option's text. fill: accepted answers separated by "|". */
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
}, (t) => [
  index("exercises_lesson_idx").on(t.lessonId),
  // Lets the template seeder re-run without duplicating questions.
  unique("exercises_lesson_order_uq").on(t.lessonId, t.orderIndex),
]);

/** Append-only log of every answer, so progress and review can be rebuilt from it. */
export const exerciseAttempts = pgTable("exercise_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  correct: boolean("correct").notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("attempts_user_idx").on(t.userId, t.answeredAt), index("attempts_exercise_idx").on(t.exerciseId)]);

/**
 * The review queue: a row exists only while a question still needs revisiting.
 * A wrong answer puts it in box 0 (due now); each correct answer moves it up a box
 * (+1, +3, +7 days) and the row is deleted once it graduates.
 */
export const reviewItems = pgTable("review_items", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  box: smallint("box").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  wrongCount: integer("wrong_count").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.exerciseId] }),
  index("review_due_idx").on(t.userId, t.dueAt),
]);

// ========== PROGRESS ==========
export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"), // not_started | in_progress | completed | skipped
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  actualMinutes: integer("actual_minutes"),
  difficulty: smallint("difficulty"),
  note: text("note"),
}, (t) => [
  unique("lesson_progress_user_lesson_uq").on(t.userId, t.lessonId),
  check("difficulty_range", sql`${t.difficulty} between 1 and 5`),
]);

export const dailyStats = pgTable("daily_stats", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  plannedMinutes: integer("planned_minutes").notNull().default(0),
  actualMinutes: integer("actual_minutes").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  sessionsMissed: integer("sessions_missed").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.date] })]);

// ========== SCHEDULE ==========
export const studySchedules = pgTable("study_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roadmapId: uuid("roadmap_id").references(() => roadmaps.id, { onDelete: "cascade" }),
  daysOfWeek: smallint("days_of_week").array().notNull(), // {1,3,5} = Mon, Wed, Fri
  startTime: time("start_time").notNull(), // in the user's timezone
  durationMin: integer("duration_min").notNull().default(60),
  active: boolean("active").notNull().default(true),
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").references(() => studySchedules.id, { onDelete: "set null" }),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(), // stored in UTC
  durationMin: integer("duration_min").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming | done | missed | rescheduled
  remindedAt: timestamp("reminded_at", { withTimezone: true }),
  followupAt: timestamp("followup_at", { withTimezone: true }),
}, (t) => [
  index("sessions_due_idx").on(t.scheduledAt).where(sql`${t.status} = 'upcoming'`),
  index("sessions_user_idx").on(t.userId),
  // The reminder cron materialises sessions idempotently (ON CONFLICT DO NOTHING).
  unique("sessions_schedule_time_uq").on(t.scheduleId, t.scheduledAt),
]);

// ========== NOTIFICATION ==========
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // reminder | missed | ai_praise | ai_warning | weekly_report
  channel: text("channel").notNull(), // push | email | in_app
  title: text("title"),
  body: text("body"),
  refId: uuid("ref_id"),
  status: text("status").notNull().default("pending"), // pending | sent | failed | read
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

// ========== AI ==========
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roadmapId: uuid("roadmap_id").references(() => roadmaps.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // weekly_report | behind_schedule | ahead_of_goal | streak
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  metrics: jsonb("metrics").notNull(),
  summary: text("summary"),
  suggestions: jsonb("suggestions"),
  model: text("model"),
  createdAt: createdAt(),
}, (t) => [index("ai_insights_user_idx").on(t.userId)]);

CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_id" uuid,
	"kind" text NOT NULL,
	"period_start" date,
	"period_end" date,
	"metrics" jsonb NOT NULL,
	"summary" text,
	"suggestions" jsonb,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"planned_minutes" integer DEFAULT 0 NOT NULL,
	"actual_minutes" integer DEFAULT 0 NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"sessions_missed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_stats_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"actual_minutes" integer,
	"difficulty" smallint,
	"note" text,
	CONSTRAINT "lesson_progress_user_lesson_uq" UNIQUE("user_id","lesson_id"),
	CONSTRAINT "difficulty_range" CHECK ("lesson_progress"."difficulty" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content_md" text,
	"resource_urls" text[],
	"estimated_minutes" integer DEFAULT 30 NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"title" text,
	"body" text,
	"ref_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order_index" integer NOT NULL,
	"target_date" date
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"goal" text,
	"start_date" date NOT NULL,
	"target_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_id" uuid,
	"days_of_week" smallint[] NOT NULL,
	"start_time" time NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"schedule_id" uuid,
	"lesson_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"reminded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"locale" text DEFAULT 'vi' NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"weekly_goal_minutes" integer DEFAULT 300 NOT NULL,
	"remind_before_minutes" integer DEFAULT 15 NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"ai_tone" text DEFAULT 'friendly' NOT NULL,
	"quiet_hours_start" time,
	"quiet_hours_end" time
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_schedules" ADD CONSTRAINT "study_schedules_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_schedule_id_study_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."study_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_insights_user_idx" ON "ai_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lessons_phase_idx" ON "lessons" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "phases_roadmap_idx" ON "phases" USING btree ("roadmap_id");--> statement-breakpoint
CREATE INDEX "roadmaps_user_idx" ON "roadmaps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_due_idx" ON "study_sessions" USING btree ("scheduled_at") WHERE "study_sessions"."status" = 'upcoming';--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "study_sessions" USING btree ("user_id");
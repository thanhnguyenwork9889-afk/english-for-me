ALTER TABLE "study_sessions" ADD COLUMN "followup_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "followup_enabled" boolean DEFAULT true NOT NULL;
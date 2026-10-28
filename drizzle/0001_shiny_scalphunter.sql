CREATE TABLE "hotmart_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"event" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_credentials" (
	"provider" text PRIMARY KEY NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "google_synced" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "zoom_sent_email" SET DEFAULT false;--> statement-breakpoint
UPDATE "bookings" SET "google_synced" = false, "zoom_sent_email" = false, "link_sent_whatsapp" = false;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "zoom_meeting_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "whatsapp_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "external_reference" text;--> statement-breakpoint
CREATE UNIQUE INDEX "hotmart_events_transaction_event_unique" ON "hotmart_events" USING btree ("transaction_id","event");--> statement-breakpoint
CREATE UNIQUE INDEX "deals_external_reference_unique" ON "deals" USING btree ("external_reference");
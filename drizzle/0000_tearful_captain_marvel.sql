CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_id" text NOT NULL,
	"steam_username" text NOT NULL,
	"steam_avatar" text,
	"steam_profile_url" text,
	"game_count" integer NOT NULL,
	"games_data" jsonb NOT NULL,
	"vlayer_proof" jsonb,
	"webhook_sent" text DEFAULT 'false' NOT NULL,
	"webhook_status" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

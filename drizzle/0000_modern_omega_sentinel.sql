-- Drizzle generates the tables; the CHECK constraints below were added
-- by hand. Drizzle's SQLite text enums are a TypeScript type only, and
-- a type does not stop a hand-typed INSERT writing stage 'maybe'.
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`kind` text NOT NULL CHECK (`kind` in ('note','contact','stage-change','follow-up')),
	`body` text NOT NULL,
	`from_stage` text CHECK (`from_stage` is null or `from_stage` in ('new','qualifying','proposal','negotiation','won','lost')),
	`to_stage` text CHECK (`to_stage` is null or `to_stage` in ('new','qualifying','proposal','negotiation','won','lost')),
	`occurred_on` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_lead_idx` ON `activities` (`lead_id`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`email` text,
	`phone` text,
	`source` text NOT NULL CHECK (`source` in ('referral','website','social','outbound','event','marketplace','other')),
	`service` text,
	`value_cents` integer DEFAULT 0 NOT NULL CHECK (`value_cents` >= 0),
	`stage` text NOT NULL CHECK (`stage` in ('new','qualifying','proposal','negotiation','won','lost')),
	`notes` text,
	`last_contact_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leads_stage_idx` ON `leads` (`stage`);--> statement-breakpoint
CREATE INDEX `leads_name_idx` ON `leads` (`name`);
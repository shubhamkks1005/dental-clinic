-- 6.7.3: doctor-only past/paper history notes ("Added later").
CREATE TABLE `past_records` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`recorded_on` text NOT NULL,
	`body` text NOT NULL,
	`file_id` text,
	CONSTRAINT "past_records_recorded_on_format" CHECK("recorded_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "past_records_body_len" CHECK(length(trim("body")) >= 1 AND length("body") <= 4000)
);
--> statement-breakpoint
CREATE INDEX `past_records_patient_on_idx` ON `past_records` (`patient_id`,`recorded_on`);

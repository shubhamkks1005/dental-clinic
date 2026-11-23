-- 5.3.4: append-only call notes for patients with outstanding dues.
CREATE TABLE `dues_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`note` text NOT NULL,
	`called_on` text NOT NULL,
	CONSTRAINT "dues_calls_called_on_format" CHECK("called_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `dues_calls_patient_created_idx` ON `dues_calls` (`patient_id`,`created_at`);

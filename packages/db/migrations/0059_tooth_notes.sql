-- Doctor visit page (B7): a short clinical note per patient and tooth. One live note per tooth.
-- A clinical record, kept like tooth_events (docs/RETENTION.md). No foreign keys.
CREATE TABLE `tooth_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`tooth_fdi` integer NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT "tooth_notes_fdi_range" CHECK(("tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)),
	CONSTRAINT "tooth_notes_body_len" CHECK(length(trim("body")) BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tooth_notes_live_uidx` ON `tooth_notes` (`patient_id`,`tooth_fdi`) WHERE "deleted_at" IS NULL;

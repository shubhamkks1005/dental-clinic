CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`appointment_id` text,
	`doctor_id` text NOT NULL,
	`visit_date_local` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`chief_complaint` text,
	`history_note` text,
	`exam_note` text,
	`gum_condition` text,
	`bp_systolic` integer,
	`bp_diastolic` integer,
	`pulse` integer,
	`advice` text,
	`next_visit_note` text,
	`finalised_at` text,
	`finalised_by` text,
	`snapshot_json` text,
	`snapshot_hash` text,
	CONSTRAINT "visits_status_check" CHECK("status" IN ('draft', 'final', 'void')),
	CONSTRAINT "visits_date_local_format" CHECK("visit_date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "visits_snapshot_hash_len" CHECK(("snapshot_hash" IS NULL OR length("snapshot_hash") = 64))
);
--> statement-breakpoint
CREATE INDEX `visits_patient_date_idx` ON `visits` (`patient_id`,`visit_date_local`);--> statement-breakpoint
CREATE INDEX `visits_doctor_date_idx` ON `visits` (`doctor_id`,`visit_date_local`);--> statement-breakpoint
CREATE UNIQUE INDEX `visits_appointment_live_uidx` ON `visits` (`appointment_id`) WHERE "visits"."appointment_id" IS NOT NULL AND "visits"."deleted_at" IS NULL;
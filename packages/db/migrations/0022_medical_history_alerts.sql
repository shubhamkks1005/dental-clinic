CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`restricted` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`source_history_id` text,
	CONSTRAINT "alerts_restricted_bool" CHECK("restricted" IN (0, 1)),
	CONSTRAINT "alerts_active_bool" CHECK("active" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alerts_patient_code_live_uidx` ON `alerts` (`patient_id`,`code`) WHERE "alerts"."deleted_at" IS NULL AND "alerts"."active" = 1;--> statement-breakpoint
CREATE INDEX `alerts_patient_active_idx` ON `alerts` (`patient_id`,`active`);--> statement-breakpoint
CREATE TABLE `medical_history` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`version_no` integer NOT NULL,
	`answers_json` text NOT NULL,
	`recorded_at` text NOT NULL,
	`recorded_by` text NOT NULL,
	CONSTRAINT "medical_history_answers_json" CHECK(json_valid("answers_json")),
	CONSTRAINT "medical_history_version_positive" CHECK("version_no" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_history_patient_version_uidx` ON `medical_history` (`patient_id`,`version_no`);--> statement-breakpoint
CREATE INDEX `medical_history_patient_recorded_idx` ON `medical_history` (`patient_id`,`recorded_at`);
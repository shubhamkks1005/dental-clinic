CREATE TABLE `consents` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`type` text NOT NULL,
	`notice_version` integer NOT NULL,
	`given` integer NOT NULL,
	`given_at` text NOT NULL,
	`recorded_by` text NOT NULL,
	`method` text NOT NULL,
	CONSTRAINT "consents_type_check" CHECK("type" IN ('privacy_notice', 'sms_reminders', 'marketing', 'treatment', 'photo', 'portal')),
	CONSTRAINT "consents_method_check" CHECK("method" IN ('paper', 'verbal', 'form', 'portal')),
	CONSTRAINT "consents_notice_version_positive" CHECK("notice_version" >= 1),
	CONSTRAINT "consents_given_bool" CHECK("given" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `consents_patient_id_idx` ON `consents` (`patient_id`);
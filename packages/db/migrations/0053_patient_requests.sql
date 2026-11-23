-- 8.2.11 Cut A: staff-tracked patient requests (portal form later; paper/phone intake now).
CREATE TABLE `patient_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`type` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`due_on` text NOT NULL,
	`closed_note` text,
	`closed_at` text,
	`closed_by` text,
	CONSTRAINT "patient_requests_type_check" CHECK("type" IN ('correct','copy','withdraw_consent','other')),
	CONSTRAINT "patient_requests_status_check" CHECK("status" IN ('open','done','rejected')),
	CONSTRAINT "patient_requests_body_len" CHECK(length("body") <= 500)
);
--> statement-breakpoint
CREATE INDEX `patient_requests_status_due_idx` ON `patient_requests` (`status`,`due_on`);
--> statement-breakpoint
CREATE INDEX `patient_requests_patient_idx` ON `patient_requests` (`patient_id`,`created_at`);

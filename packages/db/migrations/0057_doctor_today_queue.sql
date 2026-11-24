-- Part T (doctor Today): saved queue order and flags on appointments, the doctor's breaks, and the
-- desk's requests to the doctor. Columns are added in place (no table rebuild). No foreign keys.
ALTER TABLE `appointments` ADD `queue_order` integer;
--> statement-breakpoint
ALTER TABLE `appointments` ADD `stepped_out_at` text;
--> statement-breakpoint
ALTER TABLE `appointments` ADD `skip_count` integer DEFAULT 0 NOT NULL CONSTRAINT "appointments_skip_count_min" CHECK("skip_count" >= 0);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `late_at` text;
--> statement-breakpoint
ALTER TABLE `appointments` ADD `queue_changed_at` text;
--> statement-breakpoint
ALTER TABLE `appointments` ADD `queue_changed_by` text;
--> statement-breakpoint
CREATE INDEX `appointments_day_queue_idx` ON `appointments` (`date_local`,`queue_order`);
--> statement-breakpoint
CREATE TABLE `doctor_breaks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`started_at` text NOT NULL,
	`date_local` text NOT NULL,
	`minutes` integer NOT NULL,
	`label` text NOT NULL,
	`ended_at` text,
	CONSTRAINT "doctor_breaks_minutes_range" CHECK("minutes" BETWEEN 5 AND 120),
	CONSTRAINT "doctor_breaks_label_len" CHECK(length("label") BETWEEN 1 AND 40)
);
--> statement-breakpoint
CREATE INDEX `doctor_breaks_day_idx` ON `doctor_breaks` (`date_local`,`started_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_breaks_one_open_uidx` ON `doctor_breaks` (`date_local`) WHERE "ended_at" IS NULL AND "deleted_at" IS NULL;
--> statement-breakpoint
CREATE TABLE `approval_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`appointment_id` text,
	`patient_id` text,
	`bill_id` text,
	`note` text NOT NULL,
	`detail` text,
	`urgent` integer DEFAULT false NOT NULL,
	`answer_note` text,
	`answered_at` text,
	`answered_by` text,
	CONSTRAINT "approval_requests_type_check" CHECK("type" IN ('emergency_insert', 'refund', 'overbook', 'late_today', 'break_shorten', 'reschedule_close', 'order_override')),
	CONSTRAINT "approval_requests_status_check" CHECK("status" IN ('open', 'approved', 'rejected', 'dismissed')),
	CONSTRAINT "approval_requests_note_len" CHECK(length("note") BETWEEN 1 AND 200),
	CONSTRAINT "approval_requests_answer_note_len" CHECK("answer_note" IS NULL OR length("answer_note") <= 200),
	CONSTRAINT "approval_requests_urgent_bool" CHECK("urgent" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `approval_requests_status_idx` ON `approval_requests` (`status`,`urgent`,`created_at`);
--> statement-breakpoint
CREATE INDEX `approval_requests_mine_idx` ON `approval_requests` (`created_by`,`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `approval_requests_one_open_uidx` ON `approval_requests` (`type`,`appointment_id`) WHERE "status" = 'open' AND "appointment_id" IS NOT NULL AND "deleted_at" IS NULL;
--> statement-breakpoint
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M86SETTUNLATEAFTER00001', 'appointments.late_after_minutes', '10', 'system', 'system'),
	('01M86SETTUNRUNLATE0000001', 'today.running_late_after_minutes', '10', 'system', 'system');

-- Several doctors (owner 2026-11-26): each booking names its doctor and uses that doctor's own chair;
-- doctor leave days; Today's queue, breaks and approvals become per doctor; each doctor keeps their
-- own prescription letterhead. Columns are added in place (no table rebuild). No foreign keys.
-- Old bookings are demo data: they go to the first active doctor (owner Q2) and keep chair "1".
ALTER TABLE `appointments` ADD `doctor_id` text;
--> statement-breakpoint
UPDATE `appointments`
SET `doctor_id` = (SELECT `id` FROM `users` WHERE `role` = 'doctor' AND `status` = 'active' AND `deleted_at` IS NULL ORDER BY `created_at`, `id` LIMIT 1)
WHERE `doctor_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `appointments_doctor_day_start_idx` ON `appointments` (`doctor_id`,`date_local`,`start_min`);
--> statement-breakpoint
DROP INDEX `appointments_day_queue_idx`;
--> statement-breakpoint
CREATE INDEX `appointments_day_queue_idx` ON `appointments` (`doctor_id`,`date_local`,`queue_order`);
--> statement-breakpoint
CREATE TABLE `doctor_leaves` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`doctor_id` text NOT NULL,
	`date_local` text NOT NULL,
	`note` text,
	CONSTRAINT "doctor_leaves_date_local_format" CHECK("date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "doctor_leaves_note_len" CHECK("note" IS NULL OR length("note") <= 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_leaves_one_live_uidx` ON `doctor_leaves` (`doctor_id`,`date_local`) WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX `doctor_leaves_day_idx` ON `doctor_leaves` (`date_local`);
--> statement-breakpoint
DROP INDEX `doctor_breaks_one_open_uidx`;
--> statement-breakpoint
ALTER TABLE `doctor_breaks` ADD `doctor_id` text;
--> statement-breakpoint
UPDATE `doctor_breaks` SET `doctor_id` = `created_by` WHERE `doctor_id` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_breaks_one_open_uidx` ON `doctor_breaks` (`doctor_id`,`date_local`) WHERE "ended_at" IS NULL AND "deleted_at" IS NULL;
--> statement-breakpoint
ALTER TABLE `approval_requests` ADD `doctor_id` text;
--> statement-breakpoint
UPDATE `approval_requests`
SET `doctor_id` = coalesce(
	(SELECT a.`doctor_id` FROM `appointments` a WHERE a.`id` = `approval_requests`.`appointment_id`),
	(SELECT `id` FROM `users` WHERE `role` = 'doctor' AND `status` = 'active' AND `deleted_at` IS NULL ORDER BY `created_at`, `id` LIMIT 1)
)
WHERE `doctor_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `approval_requests_doctor_status_idx` ON `approval_requests` (`doctor_id`,`status`);
--> statement-breakpoint
CREATE TABLE `doctor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`user_id` text NOT NULL,
	`name_on_rx` text NOT NULL,
	`qualifications` text DEFAULT '' NOT NULL,
	`speciality` text DEFAULT '' NOT NULL,
	`registration_no` text DEFAULT '' NOT NULL,
	`extra_line` text DEFAULT '' NOT NULL,
	CONSTRAINT "doctor_profiles_name_len" CHECK(length("name_on_rx") BETWEEN 1 AND 80),
	CONSTRAINT "doctor_profiles_qual_len" CHECK(length("qualifications") <= 120),
	CONSTRAINT "doctor_profiles_spec_len" CHECK(length("speciality") <= 80),
	CONSTRAINT "doctor_profiles_reg_len" CHECK(length("registration_no") <= 40),
	CONSTRAINT "doctor_profiles_extra_len" CHECK(length("extra_line") <= 120)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_profiles_user_uidx` ON `doctor_profiles` (`user_id`);
--> statement-breakpoint
-- The first doctor keeps today's letterhead lines; the doctor.* settings rows stay for history.
INSERT INTO `doctor_profiles` (`id`, `user_id`, `name_on_rx`, `qualifications`, `speciality`, `registration_no`, `extra_line`, `created_by`, `updated_by`)
SELECT '01M88DOCPROFILEFIRST00001', u.`id`,
	coalesce(nullif(trim(json_extract((SELECT `value_json` FROM `settings` WHERE `key` = 'doctor.name' AND `deleted_at` IS NULL), '$')), ''), u.`name`),
	coalesce(json_extract((SELECT `value_json` FROM `settings` WHERE `key` = 'doctor.qualifications' AND `deleted_at` IS NULL), '$'), ''),
	coalesce(json_extract((SELECT `value_json` FROM `settings` WHERE `key` = 'doctor.speciality' AND `deleted_at` IS NULL), '$'), ''),
	coalesce(json_extract((SELECT `value_json` FROM `settings` WHERE `key` = 'doctor.registration_no' AND `deleted_at` IS NULL), '$'), ''),
	coalesce(json_extract((SELECT `value_json` FROM `settings` WHERE `key` = 'doctor.extra_line' AND `deleted_at` IS NULL), '$'), ''),
	'system', 'system'
FROM `users` u
WHERE u.`role` = 'doctor' AND u.`status` = 'active' AND u.`deleted_at` IS NULL
ORDER BY u.`created_at`, u.`id`
LIMIT 1;

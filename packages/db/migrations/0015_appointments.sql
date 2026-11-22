CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`chair_id` text NOT NULL,
	`visit_type_id` text NOT NULL,
	`visit_type_label` text NOT NULL,
	`start_at` text NOT NULL,
	`date_local` text NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`overbook` integer DEFAULT false NOT NULL,
	`complaint` text,
	`cancel_reason` text,
	`rescheduled_from` text,
	`arrived_at` text,
	`started_at` text,
	`ended_at` text,
	CONSTRAINT "appointments_status_check" CHECK("status" IN ('scheduled', 'confirmed', 'arrived', 'in_chair', 'completed', 'cancelled', 'no_show', 'rescheduled')),
	CONSTRAINT "appointments_source_check" CHECK("source" IN ('phone', 'walk_in', 'referral', 'other')),
	CONSTRAINT "appointments_priority_check" CHECK("priority" IN ('normal', 'emergency')),
	CONSTRAINT "appointments_overbook_bool" CHECK("overbook" IN (0, 1)),
	CONSTRAINT "appointments_mins_range" CHECK(("start_min" >= 0 AND "start_min" < 1440 AND "end_min" > "start_min" AND "end_min" <= 1440)),
	CONSTRAINT "appointments_date_local_format" CHECK("date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `appointments_chair_day_start_idx` ON `appointments` (`chair_id`,`date_local`,`start_min`);--> statement-breakpoint
CREATE INDEX `appointments_patient_day_idx` ON `appointments` (`patient_id`,`date_local`);--> statement-breakpoint
CREATE INDEX `appointments_day_status_idx` ON `appointments` (`date_local`,`status`);

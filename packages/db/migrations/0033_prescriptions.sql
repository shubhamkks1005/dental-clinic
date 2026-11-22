CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`visit_id` text,
	`doctor_id` text NOT NULL,
	`weight_kg` integer,
	`advice` text,
	`follow_up_on` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`rx_no` text,
	`rx_period` text,
	`dentist_dispensed` integer DEFAULT 0 NOT NULL,
	`dentist_dispensed_note` text,
	`revised_from_id` text,
	`issued_at` text,
	`issued_by` text,
	`share_with_portal` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "prescriptions_status_check" CHECK("status" IN ('draft', 'issued', 'revised')),
	CONSTRAINT "prescriptions_follow_up_on_format" CHECK(("follow_up_on" IS NULL OR "follow_up_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "prescriptions_weight_positive" CHECK(("weight_kg" IS NULL OR "weight_kg" > 0)),
	CONSTRAINT "prescriptions_dispensed_bool" CHECK("dentist_dispensed" IN (0, 1)),
	CONSTRAINT "prescriptions_share_bool" CHECK("share_with_portal" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `prescriptions_patient_created_idx` ON `prescriptions` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `prescriptions_visit_idx` ON `prescriptions` (`visit_id`);--> statement-breakpoint
CREATE TABLE `prescription_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`prescription_id` text NOT NULL,
	`medicine_id` text,
	`generic_name` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`form` text NOT NULL,
	`strength` text DEFAULT '' NOT NULL,
	`dose` text NOT NULL,
	`frequency` text NOT NULL,
	`days` text NOT NULL,
	`timing` text NOT NULL,
	`instruction` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prescription_items_rx_idx` ON `prescription_items` (`prescription_id`,`sort_order`);

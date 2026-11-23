CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cert_no` text,
	`cert_period` text,
	`patient_name` text NOT NULL,
	`patient_age` text NOT NULL,
	`patient_address` text DEFAULT '' NOT NULL,
	`identification_mark` text NOT NULL,
	`sign_method` text NOT NULL,
	`reason` text NOT NULL,
	`from_on` text NOT NULL,
	`to_on` text NOT NULL,
	`diagnosis` text,
	`doctor_registration_no` text,
	`revised_from_id` text,
	`finalised_at` text,
	`finalised_by` text,
	CONSTRAINT "certificates_status_check" CHECK("status" IN ('draft', 'finalised', 'revised')),
	CONSTRAINT "certificates_sign_method_check" CHECK("sign_method" IN ('signature', 'thumb')),
	CONSTRAINT "certificates_from_on_format" CHECK("from_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "certificates_to_on_format" CHECK("to_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `certificates_patient_created_idx` ON `certificates` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `certificates_period_no_idx` ON `certificates` (`cert_period`,`cert_no`);

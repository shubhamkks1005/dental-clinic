CREATE TABLE `patient_search` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`token` text NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "patient_search_kind_check" CHECK("kind" IN ('name', 'mobile', 'mobile_rev', 'code', 'legacy'))
);
--> statement-breakpoint
CREATE INDEX `patient_search_token_idx` ON `patient_search` (`token`);--> statement-breakpoint
CREATE INDEX `patient_search_patient_id_idx` ON `patient_search` (`patient_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `patient_search_patient_token_kind` ON `patient_search` (`patient_id`,`token`,`kind`);
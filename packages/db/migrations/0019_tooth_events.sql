CREATE TABLE `tooth_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`tooth_fdi` integer NOT NULL,
	`surface` text NOT NULL,
	`condition_code` text NOT NULL,
	`visit_id` text,
	`noted_at` text NOT NULL,
	`noted_by` text NOT NULL,
	CONSTRAINT "tooth_events_surface_check" CHECK("surface" IN ('m', 'd', 'o', 'b', 'l', 'whole')),
	CONSTRAINT "tooth_events_fdi_range" CHECK(("tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85))
);
--> statement-breakpoint
CREATE INDEX `tooth_events_patient_tooth_idx` ON `tooth_events` (`patient_id`,`tooth_fdi`,`noted_at`);--> statement-breakpoint
CREATE INDEX `tooth_events_patient_noted_idx` ON `tooth_events` (`patient_id`,`noted_at`);--> statement-breakpoint
CREATE INDEX `tooth_events_visit_idx` ON `tooth_events` (`visit_id`);
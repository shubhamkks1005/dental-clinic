CREATE TABLE `plan_item_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`plan_item_id` text NOT NULL,
	`estimate_paise` integer NOT NULL,
	`reason` text NOT NULL,
	`changed_at` text NOT NULL,
	`changed_by` text NOT NULL,
	CONSTRAINT "plan_item_versions_estimate_nonneg" CHECK("estimate_paise" >= 0)
);
--> statement-breakpoint
CREATE INDEX `plan_item_versions_item_idx` ON `plan_item_versions` (`plan_item_id`,`changed_at`);--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`tooth_fdi` integer,
	`list_item_id` text,
	`procedure_label` text NOT NULL,
	`estimate_paise` integer NOT NULL,
	`phase` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`sittings` integer DEFAULT 1 NOT NULL,
	`told_on` text,
	`created_visit_id` text,
	`completed_visit_id` text,
	CONSTRAINT "plan_items_status_check" CHECK("status" IN ('planned', 'accepted', 'declined', 'deferred', 'in_progress', 'completed', 'cancelled')),
	CONSTRAINT "plan_items_estimate_nonneg" CHECK("estimate_paise" >= 0),
	CONSTRAINT "plan_items_phase_positive" CHECK("phase" >= 1),
	CONSTRAINT "plan_items_sittings_positive" CHECK("sittings" >= 1),
	CONSTRAINT "plan_items_tooth_fdi" CHECK(("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)),
	CONSTRAINT "plan_items_told_on_format" CHECK(("told_on" IS NULL OR "told_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'))
);
--> statement-breakpoint
CREATE INDEX `plan_items_patient_status_idx` ON `plan_items` (`patient_id`,`status`);
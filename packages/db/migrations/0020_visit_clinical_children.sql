CREATE TABLE `visit_diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`visit_id` text NOT NULL,
	`list_item_id` text,
	`label` text NOT NULL,
	`tooth_fdi` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visit_diagnoses_tooth_fdi" CHECK(("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85))
);
--> statement-breakpoint
CREATE INDEX `visit_diagnoses_visit_idx` ON `visit_diagnoses` (`visit_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `visit_procedures` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`visit_id` text NOT NULL,
	`list_item_id` text,
	`label` text NOT NULL,
	`tooth_fdi` integer,
	`surfaces_json` text DEFAULT '[]' NOT NULL,
	`note` text,
	`default_paise` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visit_procedures_surfaces_json" CHECK(json_valid("surfaces_json")),
	CONSTRAINT "visit_procedures_tooth_fdi" CHECK(("tooth_fdi" IS NULL OR "tooth_fdi" BETWEEN 11 AND 48 OR "tooth_fdi" BETWEEN 51 AND 85)),
	CONSTRAINT "visit_procedures_paise_nonneg" CHECK(("default_paise" IS NULL OR "default_paise" >= 0))
);
--> statement-breakpoint
CREATE INDEX `visit_procedures_visit_idx` ON `visit_procedures` (`visit_id`,`sort_order`);
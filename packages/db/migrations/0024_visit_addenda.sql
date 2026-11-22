CREATE TABLE `visit_addenda` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`visit_id` text NOT NULL,
	`kind` text DEFAULT 'note' NOT NULL,
	`body` text NOT NULL,
	`reason` text NOT NULL,
	`recorded_at` text NOT NULL,
	`recorded_by` text NOT NULL,
	CONSTRAINT "visit_addenda_kind_check" CHECK("kind" IN ('note', 'entered_in_error')),
	CONSTRAINT "visit_addenda_body_not_empty" CHECK(length(trim("body")) > 0),
	CONSTRAINT "visit_addenda_reason_not_empty" CHECK(length(trim("reason")) > 0)
);
--> statement-breakpoint
CREATE INDEX `visit_addenda_visit_idx` ON `visit_addenda` (`visit_id`,`recorded_at`);
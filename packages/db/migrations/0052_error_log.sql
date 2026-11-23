-- 9.2.5: staff/server error_log (no PHI; 30-day retention via purge later).
CREATE TABLE `error_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`source` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`path` text,
	`request_id` text,
	CONSTRAINT "error_log_source_check" CHECK("source" IN ('server','browser')),
	CONSTRAINT "error_log_kind_len" CHECK(length("kind") <= 80),
	CONSTRAINT "error_log_message_len" CHECK(length("message") <= 400)
);
--> statement-breakpoint
CREATE INDEX `error_log_created_idx` ON `error_log` (`created_at`);

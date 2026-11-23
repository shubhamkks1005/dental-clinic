-- 9.1.10: ops_status for backup / quota dashboard attention (no PHI in detail_json).
CREATE TABLE `ops_status` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`key` text NOT NULL,
	`status` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`checked_at` text NOT NULL,
	CONSTRAINT "ops_status_key_check" CHECK("key" IN ('backup_d1','backup_files','backup_pc','quota')),
	CONSTRAINT "ops_status_status_check" CHECK("status" IN ('ok','fail','unknown')),
	CONSTRAINT "ops_status_detail_is_json" CHECK(json_valid("detail_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ops_status_key_uq` ON `ops_status` (`key`);

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_access_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`request_id` text,
	`detail` text,
	CONSTRAINT "access_log_action_check" CHECK("action" IN ('login', 'login_failed', 'login_denied', 'logout', 'staff_change', 'view', 'export'))
);
--> statement-breakpoint
INSERT INTO `__new_access_log`("id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at", "version", "action", "resource", "resource_id", "request_id") SELECT "id", "created_at", "updated_at", "created_by", "updated_by", "deleted_at", "version", "action", "resource", "resource_id", "request_id" FROM `access_log`;--> statement-breakpoint
DROP TABLE `access_log`;--> statement-breakpoint
ALTER TABLE `__new_access_log` RENAME TO `access_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
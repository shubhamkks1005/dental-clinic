CREATE TABLE `access_log` (
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
	CONSTRAINT "access_log_action_check" CHECK("action" IN ('login', 'view', 'export'))
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`action` text NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`request_id` text,
	CONSTRAINT "audit_log_action_check" CHECK("action" IN ('create', 'update', 'delete', 'restore')),
	CONSTRAINT "audit_log_json" CHECK(("before_json" IS NULL OR json_valid("before_json")) AND ("after_json" IS NULL OR json_valid("after_json")))
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`name` text NOT NULL,
	`period` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "counters_name_check" CHECK("name" IN ('patient_code', 'prescription', 'bill', 'receipt', 'refund', 'certificate')),
	CONSTRAINT "counters_period_format" CHECK("period" = 'all' OR "period" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "counters_value_not_negative" CHECK("value" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `counters_name_period_unique` ON `counters` (`name`,`period`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text,
	`r2_key` text NOT NULL,
	`kind` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	CONSTRAINT "files_kind_check" CHECK("kind" IN ('iopa', 'opg', 'photo', 'scan', 'consent', 'logo', 'signature', 'other')),
	CONSTRAINT "files_mime_check" CHECK("mime" IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
	CONSTRAINT "files_bytes_positive" CHECK("bytes" > 0),
	CONSTRAINT "files_sha256_length" CHECK(length("sha256") = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_r2_key_unique` ON `files` (`r2_key`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`key` text NOT NULL,
	`value_json` text NOT NULL,
	CONSTRAINT "settings_value_is_json" CHECK(json_valid("value_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_role_check" CHECK("role" IN ('doctor', 'receptionist', 'developer')),
	CONSTRAINT "users_status_check" CHECK("status" IN ('active', 'disabled')),
	CONSTRAINT "users_email_lowercase" CHECK("email" = lower("email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
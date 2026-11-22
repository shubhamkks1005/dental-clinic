CREATE TABLE `print_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`document_kind` text NOT NULL,
	`document_id` text NOT NULL,
	`document_version` integer,
	`copies` integer DEFAULT 1 NOT NULL,
	`is_reprint` integer DEFAULT 0 NOT NULL,
	`printed_at` text NOT NULL,
	`printed_by` text NOT NULL,
	CONSTRAINT "print_log_copies_positive" CHECK("copies" >= 1),
	CONSTRAINT "print_log_reprint_bool" CHECK("is_reprint" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `print_log_doc_idx` ON `print_log` (`document_kind`,`document_id`,`printed_at`);

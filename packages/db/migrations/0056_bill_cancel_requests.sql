-- Q1.9: the receptionist asks the doctor to cancel a wrong bill (owner decision D4). One open request per bill.
CREATE TABLE `bill_cancel_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`bill_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`closed_at` text,
	`closed_by` text,
	CONSTRAINT "bill_cancel_requests_status_check" CHECK("status" IN ('open','done','dismissed')),
	CONSTRAINT "bill_cancel_requests_reason_len" CHECK(length("reason") BETWEEN 1 AND 200)
);
--> statement-breakpoint
CREATE INDEX `bill_cancel_requests_status_idx` ON `bill_cancel_requests` (`status`,`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `bill_cancel_requests_one_open_uidx` ON `bill_cancel_requests` (`bill_id`) WHERE "status" = 'open' AND "deleted_at" IS NULL;

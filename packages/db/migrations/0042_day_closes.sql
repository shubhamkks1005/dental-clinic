-- 5.3.9: daily cash close records.
CREATE TABLE `day_closes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`day_local` text NOT NULL,
	`status` text DEFAULT 'closed' NOT NULL,
	`cash_expected_paise` integer NOT NULL,
	`cash_counted_paise` integer NOT NULL,
	`difference_paise` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`mode_totals_json` text NOT NULL,
	`closed_by` text NOT NULL,
	`closed_at` text NOT NULL,
	`reopen_reason` text,
	`reopened_by` text,
	`reopened_at` text,
	CONSTRAINT "day_closes_status_check" CHECK("status" IN ('closed', 'reopened')),
	CONSTRAINT "day_closes_day_local_format" CHECK("day_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "day_closes_cash_expected_nonneg" CHECK("cash_expected_paise" >= 0),
	CONSTRAINT "day_closes_cash_counted_nonneg" CHECK("cash_counted_paise" >= 0)
);
--> statement-breakpoint
CREATE INDEX `day_closes_day_status_idx` ON `day_closes` (`day_local`,`status`);

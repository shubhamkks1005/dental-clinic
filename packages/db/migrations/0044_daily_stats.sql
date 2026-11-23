-- 6.2.2: recomputed day/month aggregates (INSERT OR REPLACE by natural key).
CREATE TABLE `daily_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`date_local` text NOT NULL,
	`metric` text NOT NULL,
	`dim` text DEFAULT '' NOT NULL,
	`value` integer NOT NULL,
	CONSTRAINT "daily_stats_date_local_format" CHECK("date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_stats_day_metric_dim_uidx` ON `daily_stats` (`date_local`,`metric`,`dim`);
--> statement-breakpoint
CREATE TABLE `monthly_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`month_local` text NOT NULL,
	`metric` text NOT NULL,
	`dim` text DEFAULT '' NOT NULL,
	`value` integer NOT NULL,
	CONSTRAINT "monthly_stats_month_local_format" CHECK("month_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_stats_month_metric_dim_uidx` ON `monthly_stats` (`month_local`,`metric`,`dim`);

CREATE TABLE `payment_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`payment_id` text NOT NULL,
	`bill_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	CONSTRAINT "payment_allocations_amount_positive" CHECK("amount_paise" > 0)
);--> statement-breakpoint
CREATE INDEX `payment_allocations_payment_idx` ON `payment_allocations` (`payment_id`);--> statement-breakpoint
CREATE INDEX `payment_allocations_bill_idx` ON `payment_allocations` (`bill_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`mode` text NOT NULL,
	`split_mode` text,
	`split_paise` integer,
	`reference` text DEFAULT '' NOT NULL,
	`receipt_no` text,
	`receipt_period` text,
	`received_at` text NOT NULL,
	`received_by` text NOT NULL,
	`day_local` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	CONSTRAINT "payments_mode_check" CHECK("mode" IN ('cash', 'upi', 'card', 'bank', 'cheque', 'other')),
	CONSTRAINT "payments_split_mode_check" CHECK(("split_mode" IS NULL OR "split_mode" IN ('cash','upi','card','bank','cheque','other'))),
	CONSTRAINT "payments_amount_positive" CHECK("amount_paise" > 0),
	CONSTRAINT "payments_split_nonneg" CHECK(("split_paise" IS NULL OR ("split_paise" > 0 AND "split_paise" < "amount_paise"))),
	CONSTRAINT "payments_day_local_format" CHECK("day_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);--> statement-breakpoint
CREATE INDEX `payments_patient_received_idx` ON `payments` (`patient_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `payments_day_local_idx` ON `payments` (`day_local`);--> statement-breakpoint
CREATE INDEX `payments_period_no_idx` ON `payments` (`receipt_period`,`receipt_no`);--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`payment_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`mode` text NOT NULL,
	`reason` text NOT NULL,
	`refund_no` text,
	`refund_period` text,
	`approved_by` text NOT NULL,
	`approved_at` text NOT NULL,
	CONSTRAINT "refunds_mode_check" CHECK("mode" IN ('cash', 'upi', 'card', 'bank', 'cheque', 'other')),
	CONSTRAINT "refunds_amount_positive" CHECK("amount_paise" > 0)
);--> statement-breakpoint
CREATE INDEX `refunds_payment_idx` ON `refunds` (`payment_id`);--> statement-breakpoint
CREATE INDEX `refunds_patient_idx` ON `refunds` (`patient_id`,`approved_at`);--> statement-breakpoint
CREATE INDEX `refunds_period_no_idx` ON `refunds` (`refund_period`,`refund_no`);

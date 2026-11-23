-- 7.2.1 / 7.4.1: message outbox + attempts + channel_state + phone_flags; messaging settings seed.
CREATE TABLE `message_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`appointment_id` text,
	`kind` text NOT NULL,
	`channel` text NOT NULL,
	`template_key` text NOT NULL,
	`lang` text DEFAULT 'en' NOT NULL,
	`params_json` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`segments` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`dedupe_key` text NOT NULL,
	`group_key` text,
	`fallback_of` text,
	`send_after` text NOT NULL,
	`expire_at` text NOT NULL,
	`claimed_at` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`provider_id` text,
	`last_error_code` text,
	`skip_reason` text,
	CONSTRAINT "message_outbox_kind_check" CHECK("kind" IN ('confirm','remind','same_day_remind','reschedule','cancel','recall','incomplete','dues','otp')),
	CONSTRAINT "message_outbox_channel_check" CHECK("channel" IN ('sms','whatsapp_manual','email')),
	CONSTRAINT "message_outbox_status_check" CHECK("status" IN ('queued','held','sending','sent','delivered','failed','expired','cancelled','skipped','unknown','needs_human','done_manual','dry_run','opened_in_whatsapp')),
	CONSTRAINT "message_outbox_segments_pos" CHECK("segments" >= 0),
	CONSTRAINT "message_outbox_attempts_pos" CHECK("attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_outbox_dedupe_uq` ON `message_outbox` (`dedupe_key`);
--> statement-breakpoint
CREATE INDEX `message_outbox_status_send_idx` ON `message_outbox` (`status`,`send_after`);
--> statement-breakpoint
CREATE INDEX `message_outbox_appointment_idx` ON `message_outbox` (`appointment_id`);
--> statement-breakpoint
CREATE INDEX `message_outbox_patient_created_idx` ON `message_outbox` (`patient_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `message_outbox_provider_idx` ON `message_outbox` (`provider_id`);
--> statement-breakpoint
CREATE TABLE `message_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`outbox_id` text NOT NULL,
	`attempt_no` integer NOT NULL,
	`at` text NOT NULL,
	`adapter` text NOT NULL,
	`result` text NOT NULL,
	`http_status` integer,
	`error_code` text,
	CONSTRAINT "message_attempts_no_pos" CHECK("attempt_no" >= 1)
);
--> statement-breakpoint
CREATE INDEX `message_attempts_outbox_idx` ON `message_attempts` (`outbox_id`,`attempt_no`);
--> statement-breakpoint
CREATE TABLE `channel_state` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`channel` text NOT NULL,
	`last_ping_at` text,
	`last_ok_at` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'ok' NOT NULL,
	`note` text,
	CONSTRAINT "channel_state_channel_check" CHECK("channel" IN ('sms','whatsapp_manual','email')),
	CONSTRAINT "channel_state_failures_pos" CHECK("consecutive_failures" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channel_state_channel_uq` ON `channel_state` (`channel`);
--> statement-breakpoint
CREATE TABLE `phone_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`phone` text NOT NULL,
	`flag` text NOT NULL,
	`source` text NOT NULL,
	CONSTRAINT "phone_flags_flag_check" CHECK("flag" IN ('opted_out','wrong_number','no_whatsapp','landline'))
);
--> statement-breakpoint
CREATE INDEX `phone_flags_phone_idx` ON `phone_flags` (`phone`,`flag`);
--> statement-breakpoint
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
(
  'set_messaging_settings',
  'messaging.settings',
  '{"enabled":true,"smsEnabled":false,"whatsappEnabled":true,"kinds":{"confirm":true,"remind":true,"same_day_remind":false,"reschedule":true,"cancel":true,"recall":true,"incomplete":true,"dues":true},"remindHoursBefore":24,"remindAtLocal":"17:00","quietStartLocal":"21:00","quietEndLocal":"08:00","smsDailyCap":60,"otpReserve":10,"dispatchPerTick":5,"minLeadMinutes":120,"recallPerDay":5,"stopWords":["STOP","STOPALL","UNSUBSCRIBE"],"duesIncludePaymentPending":true}',
  'system',
  'system'
);
--> statement-breakpoint
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
(
  'set_messaging_templates',
  'messaging.templates',
  '{"draftBanner":"DRAFT - doctor to confirm","templates":{"confirm":"Dear {naam}, your appointment at {clinic} is booked for {din} {tareekh}, {samay}. To change it, call {fone}.","remind":"Dear {naam}, a reminder of your appointment at {clinic} tomorrow at {samay}. To change it, call {fone}.","reschedule":"Dear {naam}, your appointment at {clinic} is now on {din} {tareekh}, {samay}. Questions? Call {fone}.","cancel":"Dear {naam}, your appointment at {clinic} on {din} {tareekh}, {samay} is cancelled. To rebook, call {fone}.","recall":"Dear {naam}, this is {clinic}. It is time for your next visit. To book, call {fone}.","incomplete":"Dear {naam}, this is {clinic}. It is time for your next visit. To book, call {fone}.","dues":"Dear {naam}, this is {clinic}. A payment is pending. Please call {fone} to arrange.","otp":"{otp} is your {clinic} login code. It expires in 5 minutes. Do not share it."}}',
  'system',
  'system'
);

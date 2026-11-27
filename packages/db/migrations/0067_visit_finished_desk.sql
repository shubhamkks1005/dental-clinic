-- Visit finished page (owner 2026-11-27, docs/design/handoff/visit-finished.md P1.3.1 and P10.1).
-- 1) The doctor may pass an issued prescription to the desk to print: who asked, when, and when the
--    desk printed it. 2) An invoice may be started by the desk at arrival, before the visit exists:
--    it names the appointment and gets its visit when the doctor makes the invoice.
-- 3) Setting billing.invoice_timing: after_visit (default, today's flow) or at_arrival.
ALTER TABLE `prescriptions` ADD `desk_print_requested_at` text;
--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `desk_print_requested_by` text;
--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `desk_printed_at` text;
--> statement-breakpoint
ALTER TABLE `bills` ADD `appointment_id` text;
--> statement-breakpoint
CREATE INDEX `bills_appointment_idx` ON `bills` (`appointment_id`);
--> statement-breakpoint
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M88SETBILLINVTIMING01', 'billing.invoice_timing', '"after_visit"', 'system', 'system');

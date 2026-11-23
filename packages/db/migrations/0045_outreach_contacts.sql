-- 6.3.7: doctor call-list contact notes (incomplete treatment + recall).
CREATE TABLE `outreach_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`patient_id` text NOT NULL,
	`list_kind` text NOT NULL,
	`note` text NOT NULL,
	`contacted_on` text NOT NULL,
	CONSTRAINT "outreach_contacts_list_kind_check" CHECK("list_kind" IN ('incomplete','recall')),
	CONSTRAINT "outreach_contacts_contacted_on_format" CHECK("contacted_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `outreach_contacts_patient_kind_idx` ON `outreach_contacts` (`patient_id`,`list_kind`,`contacted_on`);

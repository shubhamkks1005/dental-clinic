-- 3.7.2: original filename + optional caption/tooth/date/thumb for patient file uploads.
ALTER TABLE `files` ADD `original_filename` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `caption` text;--> statement-breakpoint
ALTER TABLE `files` ADD `tooth_fdi` integer;--> statement-breakpoint
ALTER TABLE `files` ADD `taken_on` text;--> statement-breakpoint
ALTER TABLE `files` ADD `thumb_key` text;

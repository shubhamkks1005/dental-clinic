-- 9.2.5: who (role) and which build (app version) an error came from. No personal data.
ALTER TABLE `error_log` ADD `app_version` text;
--> statement-breakpoint
ALTER TABLE `error_log` ADD `role` text;

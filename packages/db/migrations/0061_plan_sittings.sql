-- Doctor visit page: "RCT, 2 sittings left". The doctor says per procedure line whether the treatment
-- is finished or needs more sittings; finalise then counts one sitting on the matching plan item.
-- Columns are added in place with a default, so older rows stay valid. No foreign keys.
ALTER TABLE `plan_items` ADD `sittings_done` integer DEFAULT 0 NOT NULL CONSTRAINT "plan_items_sittings_done_nonneg" CHECK("sittings_done" >= 0);
--> statement-breakpoint
ALTER TABLE `visit_procedures` ADD `more_sittings` integer DEFAULT 0 NOT NULL CONSTRAINT "visit_procedures_more_sittings_flag" CHECK("more_sittings" IN (0, 1));

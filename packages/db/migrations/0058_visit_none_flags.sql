-- Doctor visit page: the doctor can say "No diagnosis for this visit" / "No procedure for this visit".
-- Stored on the visit so the finalise warning goes away. Columns are added in place. No foreign keys.
ALTER TABLE `visits` ADD `no_diagnosis` integer DEFAULT 0 NOT NULL CONSTRAINT "visits_no_diagnosis_flag" CHECK("no_diagnosis" IN (0, 1));
--> statement-breakpoint
ALTER TABLE `visits` ADD `no_procedure` integer DEFAULT 0 NOT NULL CONSTRAINT "visits_no_procedure_flag" CHECK("no_procedure" IN (0, 1));

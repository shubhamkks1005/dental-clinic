-- 3.5.13: index for patient history file source (clinic rows keep patient_id NULL).
CREATE INDEX `files_patient_created_idx` ON `files` (`patient_id`,`created_at`);

-- Library (2026-11-26): the same name may be saved twice when another field differs (for example
-- two strengths of one medicine). The exact-duplicate check moves to the app (lists repo).
DROP INDEX `list_items_key_label_unique`;
--> statement-breakpoint
CREATE INDEX `list_items_key_label_idx` ON `list_items` (`list_key`, `label`);
--> statement-breakpoint
-- Owner Q5/Q9: seeded medicines are added directly, not "Needs review". Their placeholder
-- category "DRAFT - doctor to confirm" is blanked so no card shows a DRAFT pill. Rows the doctor
-- added are not touched.
UPDATE `list_items`
SET `data_json` = json_set(
      `data_json`,
      '$.reviewed', 'yes',
      '$.category', CASE
        WHEN json_extract(`data_json`, '$.category') = 'DRAFT - doctor to confirm' THEN ''
        ELSE coalesce(json_extract(`data_json`, '$.category'), '')
      END
    ),
    `version` = `version` + 1,
    `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `list_key` = 'medicines' AND `created_by` = 'system' AND `deleted_at` IS NULL;
--> statement-breakpoint
-- Library usage counter: "You wrote this N times" reads the signed-in doctor's issued prescriptions.
CREATE INDEX `prescriptions_doctor_status_idx` ON `prescriptions` (`doctor_id`, `status`);

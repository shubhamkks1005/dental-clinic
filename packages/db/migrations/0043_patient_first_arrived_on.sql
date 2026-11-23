-- 6.2.1: first clinic arrival date (IST YYYY-MM-DD) for "new patient" counts.
ALTER TABLE `patients` ADD `first_arrived_on` text;--> statement-breakpoint
CREATE INDEX `patients_first_arrived_on_idx` ON `patients` (`first_arrived_on`);--> statement-breakpoint
UPDATE `patients`
SET `first_arrived_on` = (
	SELECT MIN(`date_local`)
	FROM `appointments`
	WHERE `appointments`.`patient_id` = `patients`.`id`
		AND `appointments`.`deleted_at` IS NULL
		AND (
			`appointments`.`arrived_at` IS NOT NULL
			OR `appointments`.`status` IN ('arrived', 'in_chair', 'completed')
		)
)
WHERE `first_arrived_on` IS NULL
	AND EXISTS (
		SELECT 1
		FROM `appointments`
		WHERE `appointments`.`patient_id` = `patients`.`id`
			AND `appointments`.`deleted_at` IS NULL
			AND (
				`appointments`.`arrived_at` IS NOT NULL
				OR `appointments`.`status` IN ('arrived', 'in_chair', 'completed')
			)
	);

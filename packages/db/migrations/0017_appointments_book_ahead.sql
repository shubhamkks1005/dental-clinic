-- 2.3.5: max days ahead for a normal booking (override with reason still allowed). Default 90.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M83BOOKAHEADDAYS00000001', 'appointments.book_ahead_days', '90', 'system', 'system');

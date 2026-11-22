-- 3.3.4: months before medical history is treated as stale on visit open.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M83MHSTALEMONTHS00000001', 'medical_history.stale_months', '6', 'system', 'system');

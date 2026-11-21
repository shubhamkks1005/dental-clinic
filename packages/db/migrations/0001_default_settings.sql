-- Default settings. The doctor can change them later in Settings; never hard-code these in app code.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M7ZVGWVN9E51CTC62GCA7F0H', 'patient_code.prefix', '"P-"', 'system', 'system'),
	('01M7ZVGWVP4MFRDJ3CJVTW343X', 'patient_code.digits', '6', 'system', 'system');

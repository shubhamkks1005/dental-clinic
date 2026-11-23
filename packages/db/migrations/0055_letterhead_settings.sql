-- Letterhead lines from the owner's paper. Empty on purpose: the clinic enters its own details in
-- Settings > Clinic details (no real clinic data in the repo).
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M85SETCLINICKIND0000001', 'clinic.kind', '""', 'system', 'system'),
	('01M85SETCLINICEMAIL000001', 'clinic.email', '""', 'system', 'system'),
	('01M85SETCLINICINSTA000001', 'clinic.instagram', '""', 'system', 'system'),
	('01M85SETDOCTOREXTRA000001', 'doctor.extra_line', '""', 'system', 'system');

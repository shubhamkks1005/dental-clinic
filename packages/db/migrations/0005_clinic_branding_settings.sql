-- Clinic name and logo for the public landing page (GET /api/staff/auth/branding).
-- The doctor edits both later in Settings (1.5.2). Logo null = show the placeholder tooth mark.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M81J185YC7T58NYF0WQ5PP98', 'clinic.name', '"Align Dentistry"', 'system', 'system'),
	('01M81J185ZZYH2QN7FSF4ZNB0W', 'clinic.logo', 'null', 'system', 'system');

-- 4.3.2 letterhead fields for print (placeholders until doctor fills real clinic details).
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M84SETCLINICADDR0000001', 'clinic.address', '"Sample address — set in Settings"', 'system', 'system'),
	('01M84SETCLINICPHONE000001', 'clinic.phone', '"0000000000"', 'system', 'system'),
	('01M84SETCLINICTAG00000001', 'clinic.tagline', '"Family dental care"', 'system', 'system'),
	('01M84SETDOCTORNAME0000001', 'doctor.name', '"Dr Sample"', 'system', 'system'),
	('01M84SETDOCTORQUAL0000001', 'doctor.qualifications', '"BDS"', 'system', 'system'),
	('01M84SETDOCTORSPEC0000001', 'doctor.speciality', '"Dental surgeon"', 'system', 'system'),
	('01M84SETDOCTORREG00000001', 'doctor.registration_no', '""', 'system', 'system'),
	('01M84SETMEDREVIEW00000001', 'medicines.list_reviewed', 'null', 'system', 'system');

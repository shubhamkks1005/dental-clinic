-- Doctor visit page: the doctor's QR picture on the prescription (a small PNG or JPEG as a data URL).
-- null = none. Read on its own, not with the list of all settings.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M87SETCLINICQRIMAGE01', 'clinic.qr_image', 'null', 'system', 'system');

-- 2.2.7: versioned privacy notice shown at registration. Final lawyer text replaces the PLACEHOLDER later.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M82PNVRS01NOTICEVER00001', 'privacy_notice.version', '1', 'system', 'system'),
	('01M82PNVRS01NOTICEBODY00001', 'privacy_notice.body', '"PLACEHOLDER privacy notice. The clinic will replace this with the lawyer-approved text. Staff should still record that the notice was shown."', 'system', 'system');

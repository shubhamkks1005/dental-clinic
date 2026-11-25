-- Visit finished page: the usual consultation fee in paise. 0 = not set (the doctor types it).
-- Doctor only: every billing.* setting is hidden from the desk.
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M87SETBILLCONSULTFEE01', 'billing.consultation_fee_paise', '0', 'system', 'system');

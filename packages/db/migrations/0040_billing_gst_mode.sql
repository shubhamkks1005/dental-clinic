-- 5.2.6: GST off by default until CA confirms (DRAFT - accountant to confirm).
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M85SETBILLGSTMODE00001', 'billing.gst_mode', '"off"', 'system', 'system');

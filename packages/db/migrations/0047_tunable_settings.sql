-- 6.5.3: magic numbers → settings (defaults from packages/shared TUNABLES).
INSERT INTO `settings` (`id`, `key`, `value_json`, `created_by`, `updated_by`) VALUES
	('01M86SETTUNNOSHOW000000001', 'appointments.no_show_after_minutes', '15', 'system', 'system'),
	('01M86SETTUNUNDO00000000001', 'appointments.status_undo_hours', '24', 'system', 'system'),
	('01M86SETTUNREFRESH00000001', 'ui.auto_refresh_seconds', '60', 'system', 'system'),
	('01M86SETTUNSTORWARN0000001', 'files.storage_warn_gb', '7', 'system', 'system'),
	('01M86SETTUNSTORCRIT0000001', 'files.storage_crit_gb', '9', 'system', 'system'),
	('01M86SETTUNINCOMP000000001', 'outreach.incomplete_days', '30', 'system', 'system'),
	('01M86SETTUNRECMIN000000001', 'outreach.recall_min_months', '6', 'system', 'system'),
	('01M86SETTUNRECMAX000000001', 'outreach.recall_max_months', '9', 'system', 'system'),
	('01M86SETTUNDEMAND000000001', 'records.demand_hours', '72', 'system', 'system');

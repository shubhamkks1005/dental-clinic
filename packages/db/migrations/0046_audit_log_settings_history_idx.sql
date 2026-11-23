-- 6.5.2: settings history looks up audit rows by table + settings row id (no full scan).
CREATE INDEX `audit_log_table_row_created_idx` ON `audit_log` (`table_name`,`row_id`,`created_at`);

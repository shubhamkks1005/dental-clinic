-- 7.7.3: append DRAFT messaging paragraph to privacy notice (lawyer/doctor to confirm).
UPDATE `settings`
SET
  `value_json` = json_quote(
    json_extract(`value_json`, '$') || char(10) || char(10) ||
    'DRAFT - lawyer to confirm. Appointment reminders: if you consent, we may send short messages by WhatsApp or SMS with only your first name, clinic name, date, time and clinic phone. No treatment, medicine or amount details. You can withdraw consent any time at the clinic or by asking staff. There is no automated SMS provider yet; staff may open WhatsApp by hand.'
  ),
  `version` = `version` + 1,
  `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  `updated_by` = 'system'
WHERE `key` = 'privacy_notice.body'
  AND json_extract(`value_json`, '$') NOT LIKE '%Appointment reminders:%';

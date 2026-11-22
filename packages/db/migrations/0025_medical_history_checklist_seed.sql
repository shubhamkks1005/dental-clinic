-- 3.3.1 DRAFT medical history checklist until 3.1.1 doctor sign-off. Fake labels only.
INSERT INTO `list_items` (`id`, `created_by`, `updated_by`, `list_key`, `label`, `data_json`, `active`, `sort_order`) VALUES
	('01M83MH01HEART0000000001', 'system', 'system', 'medical_history_items', 'Heart disease or artificial valve', '{"code":"heart_disease","section":"conditions","alert_label":"Heart / valve","restricted":""}', 1, 1),
	('01M83MH02BP0000000000001', 'system', 'system', 'medical_history_items', 'High blood pressure', '{"code":"hypertension","section":"conditions","alert_label":"High BP","restricted":""}', 1, 2),
	('01M83MH03DIABETES0000001', 'system', 'system', 'medical_history_items', 'Diabetes', '{"code":"diabetes","section":"conditions","alert_label":"Diabetes","restricted":""}', 1, 3),
	('01M83MH04THYROID00000001', 'system', 'system', 'medical_history_items', 'Thyroid problem', '{"code":"thyroid","section":"conditions","alert_label":"Thyroid","restricted":""}', 1, 4),
	('01M83MH05ASTHMA000000001', 'system', 'system', 'medical_history_items', 'Asthma', '{"code":"asthma","section":"conditions","alert_label":"Asthma","restricted":""}', 1, 5),
	('01M83MH06EPILEPSY0000001', 'system', 'system', 'medical_history_items', 'Epilepsy', '{"code":"epilepsy","section":"conditions","alert_label":"Epilepsy","restricted":""}', 1, 6),
	('01M83MH07BLEEDING0000001', 'system', 'system', 'medical_history_items', 'Bleeding problem or blood thinner', '{"code":"bleeding","section":"conditions","alert_label":"Bleeding risk","restricted":""}', 1, 7),
	('01M83MH08HEPATITIS000001', 'system', 'system', 'medical_history_items', 'Hepatitis', '{"code":"hepatitis","section":"conditions","alert_label":"Doctor to check","restricted":"yes"}', 1, 8),
	('01M83MH09TB0000000000001', 'system', 'system', 'medical_history_items', 'Tuberculosis (TB)', '{"code":"tb","section":"conditions","alert_label":"TB","restricted":""}', 1, 9),
	('01M83MH10BLOODTHIN000001', 'system', 'system', 'medical_history_items', 'Blood thinner', '{"code":"med_blood_thinner","section":"medicines","alert_label":"Blood thinner","restricted":""}', 1, 10),
	('01M83MH11STEROID00000001', 'system', 'system', 'medical_history_items', 'Steroid', '{"code":"med_steroid","section":"medicines","alert_label":"Steroid","restricted":""}', 1, 11),
	('01M83MH12BISPHOS00000001', 'system', 'system', 'medical_history_items', 'Bisphosphonate (bone medicine)', '{"code":"med_bisphosphonate","section":"medicines","alert_label":"Bisphosphonate","restricted":""}', 1, 12),
	('01M83MH13PREGNANT0000001', 'system', 'system', 'medical_history_items', 'Pregnant', '{"code":"pregnant","section":"pregnancy","alert_label":"Pregnant","restricted":""}', 1, 13),
	('01M83MH14BREASTFEED00001', 'system', 'system', 'medical_history_items', 'Breastfeeding', '{"code":"breastfeeding","section":"pregnancy","alert_label":"Breastfeeding","restricted":""}', 1, 14),
	('01M83MH15TOBACCO00000001', 'system', 'system', 'medical_history_items', 'Tobacco', '{"code":"tobacco","section":"habits","alert_label":"Tobacco","restricted":""}', 1, 15),
	('01M83MH16PAANGUTKA000001', 'system', 'system', 'medical_history_items', 'Paan or gutka', '{"code":"paan_gutka","section":"habits","alert_label":"Paan / gutka","restricted":""}', 1, 16),
	('01M83MH17ALCOHOL00000001', 'system', 'system', 'medical_history_items', 'Alcohol', '{"code":"alcohol","section":"habits","alert_label":"Alcohol","restricted":""}', 1, 17);

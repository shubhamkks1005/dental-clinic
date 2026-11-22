-- 3.2.3 DRAFT clinical list starters until 3.1.1 doctor sign-off. Fake labels only.
INSERT INTO `list_items` (`id`, `created_by`, `updated_by`, `list_key`, `label`, `data_json`, `active`, `sort_order`) VALUES
	('01M83DX01CARIES0000000001', 'system', 'system', 'diagnoses', 'Dental caries', '{}', 1, 1),
	('01M83DX02PULPITIS00000001', 'system', 'system', 'diagnoses', 'Irreversible pulpitis', '{}', 1, 2),
	('01M83DX03PERIODONT0000001', 'system', 'system', 'diagnoses', 'Chronic periodontitis', '{}', 1, 3),
	('01M83PROC01SCALING0000001', 'system', 'system', 'procedures', 'Scaling', '{"default_paise":150000,"code":"SCAL"}', 1, 1),
	('01M83PROC02FILLING0000001', 'system', 'system', 'procedures', 'Composite filling', '{"default_paise":200000,"code":"COMP"}', 1, 2),
	('01M83PROC03EXTRACT0000001', 'system', 'system', 'procedures', 'Extraction', '{"default_paise":250000,"code":"EXT"}', 1, 3),
	('01M83COND01CARIES00000001', 'system', 'system', 'conditions', 'caries', '{"color":"#C8202A"}', 1, 1),
	('01M83COND02FILLING0000001', 'system', 'system', 'conditions', 'filling', '{"color":"#1E4FA3"}', 1, 2),
	('01M83COND03RCT00000000001', 'system', 'system', 'conditions', 'rct', '{"color":"#B45309"}', 1, 3),
	('01M83COND04MISSING0000001', 'system', 'system', 'conditions', 'missing', '{"color":"#64748B"}', 1, 4),
	('01M83ALLER01PENICILLIN001', 'system', 'system', 'allergens', 'Penicillin / antibiotic', '{}', 1, 1),
	('01M83ALLER02LOCALANES001', 'system', 'system', 'allergens', 'Local anaesthetic', '{}', 1, 2),
	('01M83ALLER03LATEX0000001', 'system', 'system', 'allergens', 'Latex', '{}', 1, 3),
	('01M83PHRASE01SCAL00000001', 'system', 'system', 'quick_phrases', 'scal', '{"text":"Scaling and polishing completed. Oral hygiene instructions given."}', 1, 1),
	('01M83PHRASE02REVIEW000001', 'system', 'system', 'quick_phrases', 'review', '{"text":"Reviewed. Soft tissues healthy. Continue routine care."}', 1, 2);

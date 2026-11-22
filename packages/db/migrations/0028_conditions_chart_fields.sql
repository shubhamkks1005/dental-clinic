-- 3.4.4: condition colour + icon + applies_to; expand DRAFT starter list (until 3.1.1).
UPDATE `list_items` SET `label` = 'Caries', `data_json` = '{"code":"caries","color":"#C8202A","icon":"Ca","applies_to":"surface"}', `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), `updated_by` = 'system', `version` = `version` + 1 WHERE `id` = '01M83COND01CARIES00000001';
UPDATE `list_items` SET `label` = 'Filling', `data_json` = '{"code":"filling","color":"#1E4FA3","icon":"F","applies_to":"surface"}', `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), `updated_by` = 'system', `version` = `version` + 1 WHERE `id` = '01M83COND02FILLING0000001';
UPDATE `list_items` SET `label` = 'RCT', `data_json` = '{"code":"rct","color":"#B45309","icon":"R","applies_to":"whole"}', `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), `updated_by` = 'system', `version` = `version` + 1 WHERE `id` = '01M83COND03RCT00000000001';
UPDATE `list_items` SET `label` = 'Missing', `data_json` = '{"code":"missing","color":"#64748B","icon":"Mi","applies_to":"whole"}', `updated_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), `updated_by` = 'system', `version` = `version` + 1 WHERE `id` = '01M83COND04MISSING0000001';

INSERT INTO `list_items` (`id`, `created_by`, `updated_by`, `list_key`, `label`, `data_json`, `active`, `sort_order`) VALUES
	('01M83COND05CROWN000000001', 'system', 'system', 'conditions', 'Crown', '{"code":"crown","color":"#CA8A04","icon":"Cr","applies_to":"whole"}', 1, 5),
	('01M83COND06BRIDGE00000001', 'system', 'system', 'conditions', 'Bridge', '{"code":"bridge","color":"#A16207","icon":"Br","applies_to":"whole"}', 1, 6),
	('01M83COND07EXTRACTED00001', 'system', 'system', 'conditions', 'Extracted', '{"code":"extracted","color":"#475569","icon":"Ex","applies_to":"whole"}', 1, 7),
	('01M83COND08IMPLANT0000001', 'system', 'system', 'conditions', 'Implant', '{"code":"implant","color":"#0F766E","icon":"Im","applies_to":"whole"}', 1, 8),
	('01M83COND09FRACTURE000001', 'system', 'system', 'conditions', 'Fracture', '{"code":"fracture","color":"#BE123C","icon":"Fx","applies_to":"both"}', 1, 9),
	('01M83COND10MOBILE00000001', 'system', 'system', 'conditions', 'Mobile', '{"code":"mobile","color":"#9333EA","icon":"Mo","applies_to":"whole"}', 1, 10),
	('01M83COND11IMPACTED000001', 'system', 'system', 'conditions', 'Impacted', '{"code":"impacted","color":"#7C2D12","icon":"Ip","applies_to":"whole"}', 1, 11),
	('01M83COND12ROOTSTUMP00001', 'system', 'system', 'conditions', 'Root stump', '{"code":"root_stump","color":"#57534E","icon":"Rs","applies_to":"whole"}', 1, 12),
	('01M83COND13SENSITIVITY001', 'system', 'system', 'conditions', 'Sensitivity', '{"code":"sensitivity","color":"#0284C7","icon":"Se","applies_to":"surface"}', 1, 13);

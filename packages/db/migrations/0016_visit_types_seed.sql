-- 2.3.2: starter visit types (estimates until Phase 0 sheet). Colour codes the calendar.
-- Duration is snapshotted onto each appointment at booking; editing a row does not rewrite old ones.
INSERT INTO `list_items` (`id`, `created_by`, `updated_by`, `list_key`, `label`, `data_json`, `active`, `sort_order`) VALUES
	('01M83VTYPE01CONSULT000001', 'system', 'system', 'visit_types', 'Consultation', '{"minutes":20,"color":"#1E4FA3"}', 1, 1),
	('01M83VTYPE02FOLLOWUP00001', 'system', 'system', 'visit_types', 'Follow-up', '{"minutes":15,"color":"#0B7A75"}', 1, 2),
	('01M83VTYPE03CLEANING00001', 'system', 'system', 'visit_types', 'Cleaning', '{"minutes":30,"color":"#15803D"}', 1, 3),
	('01M83VTYPE04RCTSITTING001', 'system', 'system', 'visit_types', 'RCT sitting', '{"minutes":45,"color":"#B45309"}', 1, 4),
	('01M83VTYPE05EXTRACTIO0001', 'system', 'system', 'visit_types', 'Extraction', '{"minutes":30,"color":"#C8202A"}', 1, 5),
	('01M83VTYPE06ORTHOADJ00001', 'system', 'system', 'visit_types', 'Ortho adjustment', '{"minutes":20,"color":"#1E3A8A"}', 1, 6),
	('01M83VTYPE07EMERGENC00001', 'system', 'system', 'visit_types', 'Emergency', '{"minutes":20,"color":"#9A3412"}', 1, 7);

-- Doctor visit page (B8): marks the doctor draws on an X-ray or photo (pen, circle, arrow, text,
-- measure) and the scale used for mm. One versioned JSON on the file row, at most 64 KB.
-- The column is added in place. No foreign keys.
ALTER TABLE `files` ADD `annotations_json` text CONSTRAINT "files_annotations_json" CHECK("annotations_json" IS NULL OR (json_valid("annotations_json") AND length("annotations_json") <= 65536));

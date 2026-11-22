CREATE TABLE `list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`list_key` text NOT NULL,
	`label` text NOT NULL,
	`data_json` text DEFAULT '{}' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT "list_items_data_is_json" CHECK(json_valid("data_json")),
	CONSTRAINT "list_items_active_bool" CHECK("active" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `list_items_key_order_idx` ON `list_items` (`list_key`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `list_items_key_label_unique` ON `list_items` (`list_key`,`label`);
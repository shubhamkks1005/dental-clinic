-- Visit finished page: a visit has at most ONE live bill, so a double tap on Pass to reception cannot
-- make two bills or use two bill numbers. Cancelled and deleted bills do not count.
-- If this fails, two live bills already point at one visit (test data): cancel one of them and run it again.
CREATE UNIQUE INDEX `bills_visit_live_uidx` ON `bills` (`visit_id`) WHERE "visit_id" IS NOT NULL AND "status" != 'cancelled' AND "deleted_at" IS NULL;

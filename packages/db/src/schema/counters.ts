import { COUNTER_NAMES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// period is a financial year like '2026-27', or 'all' for numbers that never reset.
export const counters = sqliteTable(
  "counters",
  {
    ...standardColumns(),
    name: text("name", { enum: COUNTER_NAMES }).notNull(),
    period: text("period").notNull(),
    value: integer("value").notNull().default(0),
  },
  (t) => [
    unique("counters_name_period_unique").on(t.name, t.period),
    check("counters_name_check", oneOf(t.name.name, COUNTER_NAMES)),
    check(
      "counters_period_format",
      sql.raw(`"period" = 'all' OR "period" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'`),
    ),
    check("counters_value_not_negative", sql.raw(`"value" >= 0`)),
  ],
);

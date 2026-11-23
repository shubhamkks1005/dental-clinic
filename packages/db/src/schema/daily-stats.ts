import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { standardColumns } from "./columns";

/** 6.2.2: recomputed day aggregates. Upsert by (date_local, metric, dim). */
export const dailyStats = sqliteTable(
  "daily_stats",
  {
    ...standardColumns(),
    dateLocal: text("date_local").notNull(),
    metric: text("metric").notNull(),
    dim: text("dim").notNull().default(""),
    value: integer("value").notNull(),
  },
  (t) => [
    unique("daily_stats_day_metric_dim_uidx").on(t.dateLocal, t.metric, t.dim),
    check(
      "daily_stats_date_local_format",
      sql.raw(`"date_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);

/** 6.2.2: recomputed month aggregates. Upsert by (month_local, metric, dim). */
export const monthlyStats = sqliteTable(
  "monthly_stats",
  {
    ...standardColumns(),
    monthLocal: text("month_local").notNull(),
    metric: text("metric").notNull(),
    dim: text("dim").notNull().default(""),
    value: integer("value").notNull(),
  },
  (t) => [
    unique("monthly_stats_month_metric_dim_uidx").on(t.monthLocal, t.metric, t.dim),
    check(
      "monthly_stats_month_local_format",
      sql.raw(`"month_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);

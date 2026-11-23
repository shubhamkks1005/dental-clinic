import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

const DAY_CLOSE_STATUSES = ["closed", "reopened"] as const;

/** 5.3.9: daily cash close. One live closed row per day_local until reopened. */
export const dayCloses = sqliteTable(
  "day_closes",
  {
    ...standardColumns(),
    dayLocal: text("day_local").notNull(),
    status: text("status", { enum: DAY_CLOSE_STATUSES }).notNull().default("closed"),
    cashExpectedPaise: integer("cash_expected_paise").notNull(),
    cashCountedPaise: integer("cash_counted_paise").notNull(),
    differencePaise: integer("difference_paise").notNull(),
    note: text("note").notNull().default(""),
    modeTotalsJson: text("mode_totals_json").notNull(),
    closedBy: text("closed_by").notNull(),
    closedAt: text("closed_at").notNull(),
    reopenReason: text("reopen_reason"),
    reopenedBy: text("reopened_by"),
    reopenedAt: text("reopened_at"),
  },
  (t) => [
    index("day_closes_day_status_idx").on(t.dayLocal, t.status),
    check("day_closes_status_check", oneOf(t.status.name, DAY_CLOSE_STATUSES)),
    check(
      "day_closes_day_local_format",
      sql.raw(`"day_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check("day_closes_cash_expected_nonneg", sql.raw(`"cash_expected_paise" >= 0`)),
    check("day_closes_cash_counted_nonneg", sql.raw(`"cash_counted_paise" >= 0`)),
  ],
);

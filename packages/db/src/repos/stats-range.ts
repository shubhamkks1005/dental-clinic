import { addIstDays, addMonthsYm, istLocalToUtc } from "@clinic/shared";
import { and, gte, lt, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { istMonthStartUtcIso } from "./patients";

// S2.2: one place for the date math of the stats queries. Every filter is a half-open range
// (>= from AND < to) so the date indexes are used; no LIKE and no date() on a column.
export type StatPeriod = {
  /** IST local days: first day, and the day AFTER the last one (exclusive). */
  dayFrom: string;
  dayTo: string;
  /** The same period as UTC instants, for timestamp columns such as refunds.approved_at. */
  utcFrom: string;
  utcTo: string;
};

// addMonthsYm lives in @clinic/shared (one copy); re-exported so callers here keep one import.
export { addMonthsYm };

// Start of an IST month as UTC ISO. Reuses the patients helper (it reads the IST month of a Date).
function monthStartUtc(ym: string): string {
  return istMonthStartUtcIso(istLocalToUtc(`${ym}-01`, 0));
}

export function dayPeriod(day: string): StatPeriod {
  const next = addIstDays(day, 1);
  return {
    dayFrom: day,
    dayTo: next,
    utcFrom: istLocalToUtc(day, 0).toISOString(),
    utcTo: istLocalToUtc(next, 0).toISOString(),
  };
}

export function monthPeriod(ym: string): StatPeriod {
  const next = addMonthsYm(ym, 1);
  return {
    dayFrom: `${ym}-01`,
    dayTo: `${next}-01`,
    utcFrom: monthStartUtc(ym),
    utcTo: monthStartUtc(next),
  };
}

/** column >= from AND column < to, for a column that holds an IST day (YYYY-MM-DD). */
export function inDays(col: SQLiteColumn, p: StatPeriod): SQL {
  return and(gte(col, p.dayFrom), lt(col, p.dayTo)) as SQL;
}

/** column >= from AND column < to, for a UTC ISO timestamp column. */
export function inUtc(col: SQLiteColumn, p: StatPeriod): SQL {
  return and(gte(col, p.utcFrom), lt(col, p.utcTo)) as SQL;
}

import { newUlid, type CounterName } from "@clinic/shared";
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "./client";
import { counters, settings } from "./schema";
import { nowUtcSql } from "./sql";

// Counter period for numbers that never reset (patient code). Others use financialYearOf().
export const NEVER_RESETS = "all";

// Gap-free numbers (AGENTS.md data rules). Put `bump` and the insert that uses `value` in the
// SAME db.batch(): D1 runs a batch as one transaction, so a failed insert also undoes the bump.
export function takeNumber(db: Db, counter: CounterName, period: string, actor: string) {
  const bump = db
    .insert(counters)
    .values({ id: newUlid(), name: counter, period, value: 1, createdBy: actor, updatedBy: actor })
    .onConflictDoUpdate({
      target: [counters.name, counters.period],
      set: {
        value: sql`${counters.value} + 1`,
        version: sql`${counters.version} + 1`,
        updatedAt: nowUtcSql,
        updatedBy: actor,
      },
    });
  const value = sql<number>`(SELECT ${counters.value} FROM ${counters} WHERE ${counters.name} = ${counter} AND ${counters.period} = ${period})`;
  return { bump, value };
}

// Patient code like P-000412 from the patient_code.prefix and patient_code.digits settings.
// Stored as text when the patient is created, so a later prefix change never rewrites old codes.
export function patientCodeSql(value: SQL<number>): SQL<string> {
  const setting = (key: string) =>
    sql`(SELECT json_extract(${settings.valueJson}, '$') FROM ${settings} WHERE ${settings.key} = ${key})`;
  return sql<string>`printf('%s%0*d', ${setting("patient_code.prefix")}, ${setting("patient_code.digits")}, ${value})`;
}

// 2.1.5: the one way to mint a patient code. Same takeNumber path bills/receipts/portal will use
// later (Phase 4, 5, 8) with their own counter names. Always batch `bump` with the patient INSERT.
export function takePatientCode(db: Db, actor: string) {
  const { bump, value } = takeNumber(db, "patient_code", NEVER_RESETS, actor);
  return { bump, code: patientCodeSql(value) };
}

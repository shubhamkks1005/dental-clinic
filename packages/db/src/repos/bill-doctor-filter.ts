import { sql, type SQL } from "drizzle-orm";
import type { Ctx } from "../context";
import { bills } from "../schema";

/**
 * Several doctors (owner 2026-11-26): discount and bill-cancel requests wait for the doctor of the
 * bill's visit. A bill with no visit (or an old visit with no doctor) is shown to every doctor.
 */
export function billForThisDoctor(ctx: Ctx): SQL | undefined {
  if (ctx.role !== "doctor") return undefined;
  return sql`(${bills.visitId} IS NULL OR NOT EXISTS (SELECT 1 FROM visits v WHERE v.id = ${bills.visitId} AND v.doctor_id IS NOT NULL AND v.doctor_id <> ${ctx.userId}))`;
}

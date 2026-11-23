import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { appointments, consents, patients } from "../schema";

export function messagesPlanLoadRepo(db: Db, ctx: Ctx) {
  return {
    async listAppointmentsForPlan(fromDay: string, toDay: string) {
      assertAllowed(ctx, "appointments.manage");
      return db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          status: appointments.status,
          startAt: appointments.startAt,
        })
        .from(appointments)
        .where(
          and(
            isNull(appointments.deletedAt),
            gte(appointments.dateLocal, fromDay),
            lte(appointments.dateLocal, toDay),
            inArray(appointments.status, ["scheduled", "confirmed", "arrived"]),
          ),
        )
        .all();
    },

    async getAppointment(id: string) {
      assertAllowed(ctx, "appointments.manage");
      return db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          status: appointments.status,
          startAt: appointments.startAt,
        })
        .from(appointments)
        .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
        .get();
    },

    async latestSmsReminderConsent(patientIds: string[]): Promise<Map<string, boolean>> {
      assertAllowed(ctx, "patients.view");
      const out = new Map<string, boolean>();
      if (patientIds.length === 0) return out;
      const rows = await db
        .select({
          patientId: consents.patientId,
          given: consents.given,
          givenAt: consents.givenAt,
        })
        .from(consents)
        .where(
          and(
            inArray(consents.patientId, patientIds),
            eq(consents.type, "sms_reminders"),
            isNull(consents.deletedAt),
          ),
        )
        .all();
      for (const row of rows.sort((a, b) => a.givenAt.localeCompare(b.givenAt))) {
        out.set(row.patientId, row.given === true);
      }
      return out;
    },

    async patientNames(patientIds: string[]): Promise<Map<string, string>> {
      assertAllowed(ctx, "patients.view");
      const out = new Map<string, string>();
      if (patientIds.length === 0) return out;
      const rows = await db
        .select({ id: patients.id, fullName: patients.fullName })
        .from(patients)
        .where(inArray(patients.id, patientIds))
        .all();
      for (const r of rows) out.set(r.id, r.fullName);
      return out;
    },

    async patientMobile(patientId: string): Promise<string | null> {
      assertAllowed(ctx, "patients.view");
      const row = await db
        .select({ mobile: patients.mobile })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      return row?.mobile ?? null;
    },
  };
}

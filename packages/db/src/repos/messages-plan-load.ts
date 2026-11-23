import { messageRecipient, type MessageRecipient } from "@clinic/shared";
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
          rescheduledFrom: appointments.rescheduledFrom,
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

    /** Q1.5: who gets each patient's messages (own number, else guardian, else emergency contact). */
    async recipients(patientIds: string[]): Promise<Map<string, MessageRecipient>> {
      assertAllowed(ctx, "patients.view");
      const out = new Map<string, MessageRecipient>();
      if (patientIds.length === 0) return out;
      const rows = await db
        .select({
          id: patients.id,
          fullName: patients.fullName,
          mobile: patients.mobile,
          guardianName: patients.guardianName,
          guardianMobile: patients.guardianMobile,
          emergencyName: patients.emergencyName,
          emergencyMobile: patients.emergencyMobile,
        })
        .from(patients)
        .where(and(inArray(patients.id, patientIds), isNull(patients.deletedAt)))
        .all();
      for (const r of rows) out.set(r.id, messageRecipient(r));
      return out;
    },

    /** The number messages for this patient go to (see recipients). */
    async patientMobile(patientId: string): Promise<string | null> {
      const map = await this.recipients([patientId]);
      return map.get(patientId)?.mobile ?? null;
    },
  };
}

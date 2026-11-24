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

    /**
     * Q2.8: names, codes and booking times for the Messages board, so it can group by patient.
     * `to` is set only when the message goes to someone other than the patient.
     */
    async boardContext(patientIds: string[], appointmentIds: string[]) {
      assertAllowed(ctx, "patients.view");
      const people = new Map<
        string,
        {
          code: string;
          fullName: string;
          hasNumber: boolean;
          to: string | null;
          toMobile: string | null;
        }
      >();
      const bookings = new Map<string, { dateLocal: string; startMin: number }>();
      if (patientIds.length > 0) {
        const rows = await db
          .select({
            id: patients.id,
            code: patients.code,
            fullName: patients.fullName,
            mobile: patients.mobile,
            guardianName: patients.guardianName,
            guardianRelation: patients.guardianRelation,
            guardianMobile: patients.guardianMobile,
            emergencyName: patients.emergencyName,
            emergencyRelation: patients.emergencyRelation,
            emergencyMobile: patients.emergencyMobile,
          })
          .from(patients)
          .where(and(inArray(patients.id, patientIds), isNull(patients.deletedAt)))
          .all();
        for (const r of rows) {
          const other = !r.mobile
            ? r.guardianMobile
              ? { name: r.guardianName, relation: r.guardianRelation, mobile: r.guardianMobile }
              : r.emergencyMobile
                ? {
                    name: r.emergencyName,
                    relation: r.emergencyRelation,
                    mobile: r.emergencyMobile,
                  }
                : null
            : null;
          const label = other
            ? [other.name ?? "Contact", other.relation ? `(${other.relation})` : ""]
                .filter(Boolean)
                .join(" ")
            : null;
          people.set(r.id, {
            code: r.code,
            fullName: r.fullName,
            hasNumber: Boolean(r.mobile || other),
            to: label,
            toMobile: other?.mobile ?? null,
          });
        }
      }
      if (appointmentIds.length > 0) {
        const rows = await db
          .select({
            id: appointments.id,
            dateLocal: appointments.dateLocal,
            startMin: appointments.startMin,
          })
          .from(appointments)
          .where(inArray(appointments.id, appointmentIds))
          .all();
        for (const r of rows) bookings.set(r.id, { dateLocal: r.dateLocal, startMin: r.startMin });
      }
      return { people, bookings };
    },

    /** The number messages for this patient go to (see recipients). */
    async patientMobile(patientId: string): Promise<string | null> {
      const map = await this.recipients([patientId]);
      return map.get(patientId)?.mobile ?? null;
    },
  };
}

import {
  APPOINTMENT_BUSY_STATUSES,
  APPOINTMENT_SEARCH_MAX_PATIENTS,
  APPOINTMENT_SEARCH_MAX_ROWS,
  searchWords,
  type AppointmentSearchHit,
  type AppointmentStatus,
} from "@clinic/shared";
import { and, asc, eq, gte, inArray, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { appointments, patients, users } from "../schema";
import { ownBookingsOnly } from "./appointments-list";
import { matchPatientIds } from "./patients";

// Calendar search (owner Q7): the patient search index first (max 20 patients), then their coming
// bookings that still hold a time, in one query. A doctor gets only their own bookings whatever
// doctors are asked for; the desk gets the doctors chosen in the filter (empty = all).
export function appointmentsSearchRepo(db: Db, ctx: Ctx) {
  return {
    async searchUpcoming(
      q: string,
      doctorIds: string[],
      fromDate: string,
    ): Promise<AppointmentSearchHit[]> {
      assertAllowed(ctx, "appointments.manage");
      const words = searchWords(q);
      if (words.length === 0) return [];
      const ids = (await matchPatientIds(db, words)).slice(0, APPOINTMENT_SEARCH_MAX_PATIENTS);
      if (ids.length === 0) return [];
      const chosen =
        ctx.role !== "doctor" && doctorIds.length > 0
          ? inArray(appointments.doctorId, doctorIds)
          : undefined;
      const rows = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          patientName: patients.fullName,
          patientCode: patients.code,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          doctorId: appointments.doctorId,
          doctorName: users.name,
          visitTypeLabel: appointments.visitTypeLabel,
          status: appointments.status,
        })
        .from(appointments)
        .innerJoin(patients, eq(patients.id, appointments.patientId))
        .leftJoin(users, eq(users.id, appointments.doctorId))
        .where(
          and(
            inArray(appointments.patientId, ids),
            gte(appointments.dateLocal, fromDate),
            inArray(appointments.status, [...APPOINTMENT_BUSY_STATUSES]),
            isNull(appointments.deletedAt),
            ownBookingsOnly(ctx),
            chosen,
          ),
        )
        .orderBy(asc(appointments.dateLocal), asc(appointments.startMin))
        .limit(APPOINTMENT_SEARCH_MAX_ROWS)
        .all();
      return rows.map((r) => ({ ...r, status: r.status as AppointmentStatus }));
    },
  };
}

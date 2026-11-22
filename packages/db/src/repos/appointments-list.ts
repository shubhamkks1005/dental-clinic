import type { AppointmentStatus } from "@clinic/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, patients } from "../schema";

export type PatientAppointmentRow = {
  id: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
  status: AppointmentStatus;
  visitTypeLabel: string;
  priority: string;
  source: string;
  rescheduledFrom: string | null;
  cancelReason: string | null;
  version: number;
};

/** Walk rescheduled_from links oldest → newest (2.3.8 history chain). */
export async function loadRescheduleChain(db: Db, tipId: string): Promise<PatientAppointmentRow[]> {
  const byId = new Map<string, PatientAppointmentRow>();
  let id: string | null = tipId;
  for (let i = 0; i < 20 && id; i++) {
    const row = await db
      .select({
        id: appointments.id,
        dateLocal: appointments.dateLocal,
        startMin: appointments.startMin,
        endMin: appointments.endMin,
        startAt: appointments.startAt,
        status: appointments.status,
        visitTypeLabel: appointments.visitTypeLabel,
        priority: appointments.priority,
        source: appointments.source,
        rescheduledFrom: appointments.rescheduledFrom,
        cancelReason: appointments.cancelReason,
        version: appointments.version,
      })
      .from(appointments)
      .where(and(eq(appointments.id, id), isNull(appointments.deletedAt)))
      .get();
    if (!row) break;
    const mapped: PatientAppointmentRow = {
      ...row,
      status: row.status as AppointmentStatus,
    };
    byId.set(mapped.id, mapped);
    id = mapped.rescheduledFrom;
  }
  const tip = byId.get(tipId);
  if (!tip) return [];
  const ordered: PatientAppointmentRow[] = [];
  let cur: PatientAppointmentRow | undefined = tip;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    ordered.push(cur);
    cur = cur.rescheduledFrom ? byId.get(cur.rescheduledFrom) : undefined;
  }
  return ordered.reverse();
}

export function appointmentsListRepo(db: Db, ctx: Ctx) {
  return {
    async listForPatient(patientId: string): Promise<PatientAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const rows = await db
        .select({
          id: appointments.id,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          visitTypeLabel: appointments.visitTypeLabel,
          priority: appointments.priority,
          source: appointments.source,
          rescheduledFrom: appointments.rescheduledFrom,
          cancelReason: appointments.cancelReason,
          version: appointments.version,
        })
        .from(appointments)
        .where(and(eq(appointments.patientId, patientId), isNull(appointments.deletedAt)))
        .orderBy(desc(appointments.dateLocal), desc(appointments.startMin))
        .all();
      return rows.map((r) => ({ ...r, status: r.status as AppointmentStatus }));
    },

    async rescheduleChain(id: string): Promise<PatientAppointmentRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const chain = await loadRescheduleChain(db, id);
      if (chain.length === 0) throw new NotFoundError("That appointment");
      return chain;
    },
  };
}

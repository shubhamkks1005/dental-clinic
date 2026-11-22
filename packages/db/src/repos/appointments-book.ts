import {
  DEFAULT_CHAIR_ID,
  istLocalToUtc,
  newUlid,
  visitTypeSnapshot,
  type BookAppointmentInput,
  type ListItem,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, listItems, patients } from "../schema";
import { insertAppointmentIfFree, type AppointmentInsertValues } from "./appointment-insert";

export type BookedAppointment = {
  id: string;
  patientId: string;
  visitTypeLabel: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
  status: "scheduled";
  version: number;
};

async function loadVisitType(db: Db, id: string): Promise<ListItem> {
  const row = await db
    .select()
    .from(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.listKey, "visit_types"), isNull(listItems.deletedAt)),
    )
    .get();
  if (!row || !row.active) throw new NotFoundError("That visit type");
  return {
    id: row.id,
    label: row.label,
    data: JSON.parse(row.dataJson) as ListItem["data"],
    active: row.active,
    sortOrder: row.sortOrder,
    version: row.version,
  };
}

async function requirePatient(db: Db, id: string) {
  const row = await db
    .select({ id: patients.id, status: patients.status })
    .from(patients)
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .get();
  if (!row) throw new NotFoundError("That patient");
  if (row.status !== "active") {
    throw new InvalidError("This patient is archived. Restore them before booking.");
  }
}

// 2.3.4: book one slot. Losers of the overlap race get 409 and write no audit row.
export function appointmentsBookRepo(db: Db, ctx: Ctx) {
  return {
    async book(input: BookAppointmentInput, slotMinutes: number): Promise<BookedAppointment> {
      assertAllowed(ctx, "appointments.manage");
      await requirePatient(db, input.patientId);
      const visit = await loadVisitType(db, input.visitTypeId);
      const snap = visitTypeSnapshot(visit, slotMinutes);
      const endMin = input.startMin + snap.durationMin;
      if (endMin > 1440) {
        throw new InvalidError("That visit does not fit on this day. Pick an earlier time.");
      }
      const id = newUlid();
      const values: AppointmentInsertValues = {
        id,
        patientId: input.patientId,
        chairId: DEFAULT_CHAIR_ID,
        visitTypeId: snap.visitTypeId,
        visitTypeLabel: snap.visitTypeLabel,
        startAt: istLocalToUtc(input.dateLocal, input.startMin).toISOString(),
        dateLocal: input.dateLocal,
        startMin: input.startMin,
        endMin,
        status: "scheduled",
        source: input.source,
        priority: input.priority ?? "normal",
        overbook: false,
        complaint: input.complaint ?? null,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };

      await db.batch([
        insertAppointmentIfFree(db, values),
        auditInsertIfChanged(db, ctx, {
          action: "create",
          table: "appointments",
          rowId: id,
          after: {
            patientId: values.patientId,
            dateLocal: values.dateLocal,
            startMin: values.startMin,
            endMin: values.endMin,
            visitTypeLabel: values.visitTypeLabel,
            source: values.source,
          },
        }),
      ]);

      const row = await db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          visitTypeLabel: appointments.visitTypeLabel,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          startAt: appointments.startAt,
          status: appointments.status,
          version: appointments.version,
        })
        .from(appointments)
        .where(eq(appointments.id, id))
        .get();
      if (!row || row.status !== "scheduled") {
        throw new ConflictError("That time was just taken. Pick another slot from the fresh list.");
      }
      return {
        id: row.id,
        patientId: row.patientId,
        visitTypeLabel: row.visitTypeLabel,
        dateLocal: row.dateLocal,
        startMin: row.startMin,
        endMin: row.endMin,
        startAt: row.startAt,
        status: "scheduled",
        version: row.version,
      };
    },
  };
}

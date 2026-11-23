import { istLocalToUtc, newUlid, type CreatePastRecordBody } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { files, pastRecords, patients } from "../schema";

export type PastRecordRow = {
  id: string;
  patientId: string;
  recordedOn: string;
  body: string;
  fileId: string | null;
  createdAt: string;
};

/** 6.7.3: doctor adds a past/paper note; appears in History as "Added later". */
export function pastRecordsRepo(db: Db, ctx: Ctx) {
  return {
    async create(patientId: string, input: CreatePastRecordBody): Promise<PastRecordRow> {
      assertAllowed(ctx, "clinical.edit");

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const body = input.body.trim();
      if (!body) throw new InvalidError("Write a short note for the past record.");

      const fileId = input.fileId?.trim() || null;
      if (fileId) {
        const file = await db
          .select({ id: files.id, kind: files.kind, patientId: files.patientId })
          .from(files)
          .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
          .get();
        if (!file || file.patientId !== patientId) {
          throw new InvalidError("That scan is not on this patient's file list.");
        }
        if (file.kind !== "scan" && file.kind !== "consent") {
          throw new InvalidError("Link a scan or consent file only.");
        }
      }

      const id = newUlid();
      await db.batch([
        db.insert(pastRecords).values({
          id,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          patientId,
          recordedOn: input.recordedOn,
          body,
          fileId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "past_records",
          rowId: id,
          after: { patientId, recordedOn: input.recordedOn, body, fileId },
        }),
      ]);

      const row = await db
        .select({
          id: pastRecords.id,
          patientId: pastRecords.patientId,
          recordedOn: pastRecords.recordedOn,
          body: pastRecords.body,
          fileId: pastRecords.fileId,
          createdAt: pastRecords.createdAt,
        })
        .from(pastRecords)
        .where(eq(pastRecords.id, id))
        .get();
      if (!row) throw new NotFoundError("That past record");
      return row;
    },
  };
}

/** Sort key for feed: noon IST on the historical date so the row sits with that day. */
export function pastRecordFeedAt(recordedOn: string): string {
  return istLocalToUtc(recordedOn, 12 * 60).toISOString();
}

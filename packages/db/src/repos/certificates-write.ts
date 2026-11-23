import { newUlid, type CreateCertificateInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { certificates, patients } from "../schema";
import { nowUtcSql } from "../sql";
import { certificatesGetRepo, type CertificateRow } from "./certificates-get";

type PatchInput = {
  patientName?: string;
  patientAge?: string;
  patientAddress?: string;
  identificationMark?: string;
  signMethod?: "signature" | "thumb";
  reason?: string;
  fromOn?: string;
  toOn?: string;
  diagnosis?: string | null;
  version: number;
};

export function certificatesWriteRepo(db: Db, ctx: Ctx) {
  const getRepo = certificatesGetRepo(db, ctx);

  return {
    async create(input: CreateCertificateInput): Promise<CertificateRow> {
      assertAllowed(ctx, "certificates.write");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");
      if (input.toOn < input.fromOn) {
        throw new InvalidError("The end date must be on or after the start date.");
      }

      const id = newUlid();
      await db.batch([
        db.insert(certificates).values({
          id,
          patientId: input.patientId,
          doctorId: ctx.userId,
          status: "draft",
          patientName: input.patientName,
          patientAge: input.patientAge,
          patientAddress: input.patientAddress ?? "",
          identificationMark: input.identificationMark,
          signMethod: input.signMethod,
          reason: input.reason,
          fromOn: input.fromOn,
          toOn: input.toOn,
          diagnosis: input.diagnosis?.trim() ? input.diagnosis.trim() : null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "certificates",
          rowId: id,
          before: null,
          after: { status: "draft", patientId: input.patientId },
        }),
      ]);
      return getRepo.get(id);
    },

    async patch(id: string, input: PatchInput): Promise<CertificateRow> {
      assertAllowed(ctx, "certificates.write");
      const row = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.id, id), isNull(certificates.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That certificate");
      if (row.status !== "draft") {
        throw new InvalidError("Finalised certificates cannot be edited. Create a revision.");
      }
      if (row.version !== input.version) throw new ConflictError();

      const fromOn = input.fromOn ?? row.fromOn;
      const toOn = input.toOn ?? row.toOn;
      if (toOn < fromOn) {
        throw new InvalidError("The end date must be on or after the start date.");
      }

      const results = await db.batch([
        db
          .update(certificates)
          .set({
            patientName: input.patientName ?? row.patientName,
            patientAge: input.patientAge ?? row.patientAge,
            patientAddress: input.patientAddress ?? row.patientAddress,
            identificationMark: input.identificationMark ?? row.identificationMark,
            signMethod: input.signMethod ?? row.signMethod,
            reason: input.reason ?? row.reason,
            fromOn,
            toOn,
            diagnosis:
              input.diagnosis !== undefined
                ? input.diagnosis?.trim()
                  ? input.diagnosis.trim()
                  : null
                : row.diagnosis,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(certificates.id, id), eq(certificates.version, input.version)))
          .returning({ id: certificates.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "certificates",
          rowId: id,
          before: { version: row.version },
          after: { version: row.version + 1 },
        }),
      ]);
      const updated = results[0] as { id: string }[];
      if (!updated?.length) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}

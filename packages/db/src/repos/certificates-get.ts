import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { certificates } from "../schema";

export type CertificateRow = {
  id: string;
  patientId: string;
  doctorId: string;
  status: "draft" | "finalised" | "revised";
  certNo: string | null;
  patientName: string;
  patientAge: string;
  patientAddress: string;
  identificationMark: string;
  signMethod: "signature" | "thumb";
  reason: string;
  fromOn: string;
  toOn: string;
  /** Null for receptionist (clinical). */
  diagnosis: string | null;
  doctorRegistrationNo: string | null;
  revisedFromId: string | null;
  finalisedAt: string | null;
  version: number;
};

function toRow(r: typeof certificates.$inferSelect, includeDiagnosis: boolean): CertificateRow {
  return {
    id: r.id,
    patientId: r.patientId,
    doctorId: r.doctorId,
    status: r.status,
    certNo: r.certNo,
    patientName: r.patientName,
    patientAge: r.patientAge,
    patientAddress: r.patientAddress,
    identificationMark: r.identificationMark,
    signMethod: r.signMethod,
    reason: r.reason,
    fromOn: r.fromOn,
    toOn: r.toOn,
    diagnosis: includeDiagnosis ? (r.diagnosis ?? null) : null,
    doctorRegistrationNo: r.doctorRegistrationNo,
    revisedFromId: r.revisedFromId,
    finalisedAt: r.finalisedAt,
    version: r.version,
  };
}

export function certificatesGetRepo(db: Db, ctx: Ctx) {
  return {
    async get(id: string): Promise<CertificateRow> {
      const canWrite = isAllowed(ctx.role, "certificates.write");
      const canPrint = isAllowed(ctx.role, "certificates.print");
      if (!canWrite && !canPrint) throw new ForbiddenError();

      const row = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.id, id), isNull(certificates.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That certificate");

      if (!canWrite) {
        assertAllowed(ctx, "certificates.print");
        if (row.status === "draft") throw new ForbiddenError();
      } else {
        assertAllowed(ctx, "certificates.write");
      }

      return toRow(row, canWrite);
    },
  };
}

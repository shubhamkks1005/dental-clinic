import { financialYearOf, newUlid, registrationMissing } from "@clinic/shared";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { takeNumber } from "../numbering";
import { assertAllowed, isAllowed } from "../permissions";
import { certificates, settings } from "../schema";
import { nowUtcSql } from "../sql";
import { certificatesGetRepo, type CertificateRow } from "./certificates-get";

function formatCertNo(period: string, value: ReturnType<typeof sql<number>>) {
  return sql<string>`printf('MC-%s-%04d', ${period}, ${value})`;
}

async function doctorRegistration(db: Db): Promise<string> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "doctor.registration_no"), isNull(settings.deletedAt)))
    .get();
  if (!row) return "";
  try {
    const v: unknown = JSON.parse(row.valueJson);
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

export function certificatesFinaliseRepo(db: Db, ctx: Ctx) {
  const getRepo = certificatesGetRepo(db, ctx);

  return {
    async finalise(id: string, version: number): Promise<CertificateRow> {
      assertAllowed(ctx, "certificates.write");
      const row = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.id, id), isNull(certificates.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That certificate");
      if (row.status !== "draft") {
        throw new InvalidError("Only a draft certificate can be finalised.");
      }
      if (row.version !== version) throw new ConflictError();

      const reg = await doctorRegistration(db);
      if (registrationMissing(reg)) {
        throw new InvalidError(
          "Set the doctor registration number in Settings before finalising a certificate.",
        );
      }

      const period = financialYearOf(new Date());
      const { bump, value } = takeNumber(db, "certificate", period, ctx.userId);
      const status = row.revisedFromId ? "revised" : "finalised";
      const certNo = formatCertNo(period, value);

      const results = await db.batch([
        bump,
        db
          .update(certificates)
          .set({
            status,
            certNo,
            certPeriod: period,
            doctorRegistrationNo: reg.trim(),
            finalisedAt: nowUtcSql,
            finalisedBy: ctx.userId,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(certificates.id, id), eq(certificates.version, version)))
          .returning({ id: certificates.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "certificates",
          rowId: id,
          before: { status: "draft" },
          after: { status, certPeriod: period },
        }),
      ]);
      const updated = results[1] as { id: string }[];
      if (!updated?.length) throw new ConflictError();
      return getRepo.get(id);
    },

    async revise(id: string): Promise<CertificateRow> {
      assertAllowed(ctx, "certificates.write");
      const row = await getRepo.get(id);
      if (row.status === "draft") {
        throw new InvalidError("Finalise this draft first, or edit it directly.");
      }

      const newId = newUlid();
      await db.batch([
        db.insert(certificates).values({
          id: newId,
          patientId: row.patientId,
          doctorId: ctx.userId,
          status: "draft",
          patientName: row.patientName,
          patientAge: row.patientAge,
          patientAddress: row.patientAddress,
          identificationMark: row.identificationMark,
          signMethod: row.signMethod,
          reason: row.reason,
          fromOn: row.fromOn,
          toOn: row.toOn,
          diagnosis: row.diagnosis,
          revisedFromId: row.id,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "certificates",
          rowId: newId,
          before: null,
          after: { revisedFromId: row.id, status: "draft" },
        }),
      ]);
      return getRepo.get(newId);
    },

    async listRegister(): Promise<CertificateRow[]> {
      const canWrite = isAllowed(ctx.role, "certificates.write");
      if (canWrite) assertAllowed(ctx, "certificates.write");
      else assertAllowed(ctx, "certificates.print");

      const rows = await db
        .select()
        .from(certificates)
        .where(
          and(
            inArray(certificates.status, ["finalised", "revised"]),
            isNull(certificates.deletedAt),
          ),
        )
        .orderBy(desc(certificates.finalisedAt), desc(certificates.id));

      return rows.map((r) => mapCert(r, canWrite));
    },

    async listForPatient(patientId: string): Promise<CertificateRow[]> {
      const canWrite = isAllowed(ctx.role, "certificates.write");
      if (canWrite) assertAllowed(ctx, "certificates.write");
      else assertAllowed(ctx, "certificates.print");

      const where = canWrite
        ? and(eq(certificates.patientId, patientId), isNull(certificates.deletedAt))
        : and(
            eq(certificates.patientId, patientId),
            isNull(certificates.deletedAt),
            inArray(certificates.status, ["finalised", "revised"]),
          );

      const rows = await db
        .select()
        .from(certificates)
        .where(where)
        .orderBy(desc(certificates.createdAt), asc(certificates.id));

      return rows.map((r) => mapCert(r, canWrite));
    },
  };
}

function mapCert(r: typeof certificates.$inferSelect, includeDiagnosis: boolean): CertificateRow {
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

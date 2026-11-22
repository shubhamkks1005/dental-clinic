import { type CreatePatientInput, type PatientGender } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";
import { nowUtcSql } from "../sql";
import type { PatientDetail } from "./patient-get";

type Row = typeof patients.$inferSelect;

// 2.2.4: edit basic details with version check; mobile change audited old→new.
export function patientUpdateRepo(db: Db, ctx: Ctx) {
  return {
    async update(
      id: string,
      input: CreatePatientInput & { version: number },
    ): Promise<PatientDetail> {
      assertAllowed(ctx, "patients.edit");
      const row = await load(id, input.version);
      const nextVersion = row.version + 1;
      await db.batch([
        db
          .update(patients)
          .set({
            fullName: input.fullName,
            gender: input.gender,
            dateOfBirth: input.dateOfBirth,
            ageYearsAtReg: input.ageYearsAtReg,
            mobile: input.mobile,
            noMobileReason: input.noMobileReason,
            mobileSecondary: input.mobileSecondary,
            area: input.area,
            email: input.email,
            referralSourceId: input.referralSourceId,
            referredBy: input.referredBy,
            emergencyName: input.emergencyName,
            emergencyRelation: input.emergencyRelation,
            emergencyMobile: input.emergencyMobile,
            guardianName: input.guardianName,
            guardianRelation: input.guardianRelation,
            guardianMobile: input.guardianMobile,
            messageLanguage: input.messageLanguage,
            legacyRef: input.legacyRef,
            notes: input.notes,
            version: nextVersion,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(patients.id, row.id), eq(patients.version, row.version))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "patients",
          rowId: row.id,
          before: {
            fullName: row.fullName,
            mobile: row.mobile,
            noMobileReason: row.noMobileReason,
          },
          after: {
            fullName: input.fullName,
            mobile: input.mobile,
            noMobileReason: input.noMobileReason,
          },
        }),
      ]);

      const updated = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
        .get();
      if (!updated || updated.version !== nextVersion) throw new ConflictError();

      await db.batch([
        ...rebuildPatientSearchStatements(
          db,
          id,
          {
            code: updated.code,
            fullName: updated.fullName,
            mobile: updated.mobile,
            mobileSecondary: updated.mobileSecondary,
            legacyRef: updated.legacyRef,
          },
          ctx.userId,
        ),
      ]);

      return toDetail(updated);
    },
  };

  async function load(id: string, version: number): Promise<Row> {
    const row = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("This patient");
    if (row.version !== version) throw new ConflictError();
    return row;
  }
}

function toDetail(row: Row): PatientDetail {
  return {
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    gender: row.gender as PatientGender,
    dateOfBirth: row.dateOfBirth,
    ageYearsAtReg: row.ageYearsAtReg,
    mobile: row.mobile,
    noMobileReason: row.noMobileReason,
    mobileSecondary: row.mobileSecondary,
    area: row.area,
    email: row.email,
    referralSourceId: row.referralSourceId,
    referredBy: row.referredBy,
    emergencyName: row.emergencyName,
    emergencyRelation: row.emergencyRelation,
    emergencyMobile: row.emergencyMobile,
    guardianName: row.guardianName,
    guardianRelation: row.guardianRelation,
    guardianMobile: row.guardianMobile,
    messageLanguage: row.messageLanguage,
    legacyRef: row.legacyRef,
    notes: row.notes,
    status: row.status as PatientDetail["status"],
    version: row.version,
    createdAt: row.createdAt,
  };
}

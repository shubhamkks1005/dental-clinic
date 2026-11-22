import { newUlid, type CreatePatientInput, type PatientGender } from "@clinic/shared";
import { eq } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { takePatientCode } from "../numbering";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";

export type CreatedPatient = {
  id: string;
  code: string;
  fullName: string;
  gender: PatientGender;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  mobile: string | null;
  status: "active";
  version: number;
};

// 2.2.1: mint code + insert + audit in one batch; then search tokens with the real P- code.
// (Code is SQL-minted, so tokens need a follow-up batch once the string is known.)
export function patientCreateRepo(db: Db, ctx: Ctx) {
  return {
    async create(input: CreatePatientInput): Promise<CreatedPatient> {
      assertAllowed(ctx, "patients.edit");
      const id = newUlid();
      const { bump, code } = takePatientCode(db, ctx.userId);
      await db.batch([
        bump,
        db.insert(patients).values({
          id,
          code,
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
          status: "active",
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "patients",
          rowId: id,
          after: {
            fullName: input.fullName,
            gender: input.gender,
            mobile: input.mobile,
          },
        }),
      ]);

      const row = await db
        .select({
          id: patients.id,
          code: patients.code,
          fullName: patients.fullName,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          ageYearsAtReg: patients.ageYearsAtReg,
          mobile: patients.mobile,
          status: patients.status,
          version: patients.version,
          mobileSecondary: patients.mobileSecondary,
          legacyRef: patients.legacyRef,
        })
        .from(patients)
        .where(eq(patients.id, id))
        .get();
      if (!row) throw new Error("Patient insert failed.");

      await db.batch([
        ...rebuildPatientSearchStatements(
          db,
          id,
          {
            code: row.code,
            fullName: row.fullName,
            mobile: row.mobile,
            mobileSecondary: row.mobileSecondary,
            legacyRef: row.legacyRef,
          },
          ctx.userId,
        ),
      ]);

      return {
        id: row.id,
        code: row.code,
        fullName: row.fullName,
        gender: row.gender as PatientGender,
        dateOfBirth: row.dateOfBirth,
        ageYearsAtReg: row.ageYearsAtReg,
        mobile: row.mobile,
        status: "active",
        version: row.version,
      };
    },
  };
}

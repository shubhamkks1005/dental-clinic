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
      const { consents, ...fields } = input;
      void consents;
      await db.batch([
        bump,
        db.insert(patients).values({
          id,
          code,
          fullName: fields.fullName,
          gender: fields.gender,
          dateOfBirth: fields.dateOfBirth,
          ageYearsAtReg: fields.ageYearsAtReg,
          mobile: fields.mobile,
          noMobileReason: fields.noMobileReason,
          mobileSecondary: fields.mobileSecondary,
          area: fields.area,
          email: fields.email,
          referralSourceId: fields.referralSourceId,
          referredBy: fields.referredBy,
          emergencyName: fields.emergencyName,
          emergencyRelation: fields.emergencyRelation,
          emergencyMobile: fields.emergencyMobile,
          guardianName: fields.guardianName,
          guardianRelation: fields.guardianRelation,
          guardianMobile: fields.guardianMobile,
          contactRelation: fields.contactRelation,
          messageLanguage: fields.messageLanguage,
          legacyRef: fields.legacyRef,
          notes: fields.notes,
          status: "active",
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "patients",
          rowId: id,
          after: {
            fullName: fields.fullName,
            gender: fields.gender,
            mobile: fields.mobile,
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

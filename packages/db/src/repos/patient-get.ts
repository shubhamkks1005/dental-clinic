import {
  type PatientGender,
  type PatientMessageLanguage,
  type PatientStatus,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";

export type PatientDetail = {
  id: string;
  code: string;
  fullName: string;
  gender: PatientGender;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  mobile: string | null;
  noMobileReason: string | null;
  mobileSecondary: string | null;
  area: string | null;
  email: string | null;
  referralSourceId: string | null;
  referredBy: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyMobile: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  messageLanguage: PatientMessageLanguage | null;
  legacyRef: string | null;
  notes: string | null;
  status: PatientStatus;
  version: number;
  createdAt: string;
};

// 2.2.2: one patient for the profile screen.
export function patientGetRepo(db: Db, ctx: Ctx) {
  return {
    async get(id: string): Promise<PatientDetail> {
      assertAllowed(ctx, "patients.view");
      const row = await db
        .select({
          id: patients.id,
          code: patients.code,
          fullName: patients.fullName,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          ageYearsAtReg: patients.ageYearsAtReg,
          mobile: patients.mobile,
          noMobileReason: patients.noMobileReason,
          mobileSecondary: patients.mobileSecondary,
          area: patients.area,
          email: patients.email,
          referralSourceId: patients.referralSourceId,
          referredBy: patients.referredBy,
          emergencyName: patients.emergencyName,
          emergencyRelation: patients.emergencyRelation,
          emergencyMobile: patients.emergencyMobile,
          guardianName: patients.guardianName,
          guardianRelation: patients.guardianRelation,
          guardianMobile: patients.guardianMobile,
          messageLanguage: patients.messageLanguage,
          legacyRef: patients.legacyRef,
          notes: patients.notes,
          status: patients.status,
          version: patients.version,
          createdAt: patients.createdAt,
        })
        .from(patients)
        .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("This patient");
      return {
        ...row,
        gender: row.gender as PatientGender,
        status: row.status as PatientStatus,
        messageLanguage: row.messageLanguage as PatientMessageLanguage | null,
      };
    },
  };
}

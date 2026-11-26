import {
  duplicateReason,
  normaliseMobile,
  tenDigitsFromStored,
  type DuplicateReason,
} from "@clinic/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients, patientSearch } from "../schema";

export type { DuplicateReason };

export type DuplicateProbe = {
  fullName: string;
  mobile: string | null;
  mobileSecondary: string | null;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  /** YYYY-MM-DD — usually today for a new registration. */
  onDate: string;
};

export type DuplicateHit = {
  id: string;
  code: string;
  fullName: string;
  mobile: string | null;
  reason: DuplicateReason;
};

const TOP = 3;
const CANDIDATE_CAP = 40;

// 2.1.7 + owner Q5 (2026-11-26): a warning only, never blocks save. Only patients who share a
// mobile can match (rule in @clinic/shared patient-duplicate-rule): "Same person?" for the same
// first name, a quiet "Same mobile" line otherwise. At most 3, but a same-first-name hit is
// never cut off.
export function patientDuplicatesRepo(db: Db, ctx: Ctx) {
  return {
    async findWarnings(probe: DuplicateProbe): Promise<DuplicateHit[]> {
      assertAllowed(ctx, "patients.view");
      const mobile = probe.mobile ? normaliseMobile(probe.mobile) : null;
      const secondary = probe.mobileSecondary ? normaliseMobile(probe.mobileSecondary) : null;
      const candidateIds = await mobileCandidates(db, [mobile, secondary]);
      if (candidateIds.length === 0) return [];

      const rows = await db
        .select({
          id: patients.id,
          code: patients.code,
          fullName: patients.fullName,
          mobile: patients.mobile,
          mobileSecondary: patients.mobileSecondary,
        })
        .from(patients)
        .where(and(isNull(patients.deletedAt), inArray(patients.id, candidateIds)))
        .all();

      const sameName: DuplicateHit[] = [];
      const sameMobile: DuplicateHit[] = [];
      for (const row of rows) {
        const reason = duplicateReason(
          { fullName: probe.fullName, mobile, mobileSecondary: secondary },
          row,
        );
        if (!reason) continue;
        const hit = {
          id: row.id,
          code: row.code,
          fullName: row.fullName,
          mobile: row.mobile,
          reason,
        };
        (reason === "first_name_mobile" ? sameName : sameMobile).push(hit);
      }
      return [...sameName, ...sameMobile].slice(0, Math.max(TOP, sameName.length));
    },
  };
}

async function mobileCandidates(db: Db, mobiles: (string | null)[]): Promise<string[]> {
  const ids = new Set<string>();
  for (const m of mobiles) {
    const ten = tenDigitsFromStored(m);
    if (!ten) continue;
    const rows = await db
      .selectDistinct({ patientId: patientSearch.patientId })
      .from(patientSearch)
      .where(and(eq(patientSearch.kind, "mobile"), eq(patientSearch.token, ten)))
      .limit(CANDIDATE_CAP)
      .all();
    for (const r of rows) ids.add(r.patientId);
  }
  return [...ids].slice(0, CANDIDATE_CAP);
}

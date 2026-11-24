import {
  ageYearsOn,
  normaliseMobile,
  patientNameWords,
  tenDigitsFromStored,
  tokenRangeEnd,
} from "@clinic/shared";
import { and, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients, patientSearch } from "../schema";

export type DuplicateProbe = {
  fullName: string;
  mobile: string | null;
  mobileSecondary: string | null;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  /** YYYY-MM-DD — usually today for a new registration. */
  onDate: string;
};

export type DuplicateReason = "mobile_name" | "name_age" | "secondary_mobile";

export type DuplicateHit = {
  id: string;
  code: string;
  fullName: string;
  mobile: string | null;
  reason: DuplicateReason;
};

const TOP = 3;
const CANDIDATE_CAP = 40;

// 2.1.7: soft warnings only — never blocks save. Top 3 possible matches.
export function patientDuplicatesRepo(db: Db, ctx: Ctx) {
  return {
    async findWarnings(probe: DuplicateProbe): Promise<DuplicateHit[]> {
      assertAllowed(ctx, "patients.view");
      const nameWords = patientNameWords(probe.fullName);
      const mobile = probe.mobile ? normaliseMobile(probe.mobile) : null;
      const secondary = probe.mobileSecondary ? normaliseMobile(probe.mobileSecondary) : null;
      const candidateIds = await collectCandidates(db, nameWords, mobile, secondary);
      if (candidateIds.length === 0) return [];

      const rows = await db
        .select({
          id: patients.id,
          code: patients.code,
          fullName: patients.fullName,
          mobile: patients.mobile,
          mobileSecondary: patients.mobileSecondary,
          dateOfBirth: patients.dateOfBirth,
          ageYearsAtReg: patients.ageYearsAtReg,
          createdAt: patients.createdAt,
        })
        .from(patients)
        .where(and(isNull(patients.deletedAt), inArray(patients.id, candidateIds)))
        .all();

      const probeAge = ageYearsOn(
        {
          dateOfBirth: probe.dateOfBirth,
          ageYearsAtReg: probe.ageYearsAtReg,
          registeredOn: probe.onDate,
        },
        probe.onDate,
      );

      const hits: DuplicateHit[] = [];
      for (const row of rows) {
        const reason = matchReason(probe, probeAge, nameWords, mobile, secondary, row);
        if (!reason) continue;
        hits.push({
          id: row.id,
          code: row.code,
          fullName: row.fullName,
          mobile: row.mobile,
          reason,
        });
      }
      // Strongest match first, then cap: an exact mobile must never be cut off by weaker name matches.
      const rank: Record<DuplicateReason, number> = {
        mobile_name: 0,
        secondary_mobile: 1,
        name_age: 2,
      };
      return hits.sort((a, b) => rank[a.reason] - rank[b.reason]).slice(0, TOP);
    },
  };
}

type Row = {
  id: string;
  code: string;
  fullName: string;
  mobile: string | null;
  mobileSecondary: string | null;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  createdAt: string;
};

function matchReason(
  probe: DuplicateProbe,
  probeAge: number | null,
  nameWords: string[],
  mobile: string | null,
  secondary: string | null,
  row: Row,
): DuplicateReason | null {
  const rowWords = new Set(patientNameWords(row.fullName));
  const sharedName = nameWords.some((w) => rowWords.has(w));
  const mobilesTouch = sameMobile(mobile, row.mobile) || sameMobile(mobile, row.mobileSecondary);
  const secondaryTouch =
    sameMobile(secondary, row.mobile) || sameMobile(secondary, row.mobileSecondary);

  if (mobilesTouch && sharedName) return "mobile_name";
  if (secondaryTouch) return "secondary_mobile";

  if (sharedName && probeAge != null) {
    const rowAge = ageYearsOn(
      {
        dateOfBirth: row.dateOfBirth,
        ageYearsAtReg: row.ageYearsAtReg,
        registeredOn: row.createdAt.slice(0, 10),
      },
      probe.onDate,
    );
    if (rowAge != null && Math.abs(rowAge - probeAge) <= 1) return "name_age";
  }
  return null;
}

function sameMobile(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a === b;
}

async function collectCandidates(
  db: Db,
  nameWords: string[],
  mobile: string | null,
  secondary: string | null,
): Promise<string[]> {
  const ids = new Set<string>();

  for (const word of nameWords.slice(0, 3)) {
    const rows = await db
      .selectDistinct({ patientId: patientSearch.patientId })
      .from(patientSearch)
      .where(
        and(
          eq(patientSearch.kind, "name"),
          gte(patientSearch.token, word),
          lt(patientSearch.token, tokenRangeEnd(word)),
        ),
      )
      .limit(CANDIDATE_CAP)
      .all();
    for (const r of rows) ids.add(r.patientId);
  }

  for (const m of [mobile, secondary]) {
    if (!m) continue;
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

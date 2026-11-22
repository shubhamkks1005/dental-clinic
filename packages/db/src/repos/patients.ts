import {
  pageWindow,
  searchWords,
  tokenRangeEnd,
  type Page,
  type PageQuery,
  type PatientGender,
} from "@clinic/shared";
import { and, asc, desc, eq, gte, inArray, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients, patientSearch } from "../schema";

export type PatientListRow = {
  id: string;
  code: string;
  fullName: string;
  gender: PatientGender;
  ageYearsAtReg: number | null;
  dateOfBirth: string | null;
  /** UTC ISO created_at; UI derives registeredOn via istDate for age display (2.1.4). */
  createdAt: string;
  mobile: string | null;
  status: "active" | "archived";
};

const SORTABLE = ["full_name", "code", "created_at"] as const;
/** Hard cap on ids from the token index before loading patient rows (plan budget). */
const SEARCH_ID_CAP = 100;

// 2.1.6: list uses patient_search range on the first word; extra words filter in memory.
// Soft-deleted rows are hidden; archived stays visible when q matches.
export function patientsRepo(db: Db, ctx: Ctx) {
  return {
    async list(query: PageQuery): Promise<Page<PatientListRow>> {
      assertAllowed(ctx, "patients.view");
      const words = searchWords(query.q);
      const idFilter = words.length > 0 ? await matchPatientIds(db, words) : null;
      if (idFilter !== null && idFilter.length === 0) {
        return { rows: [], total: 0, page: query.page, pageSize: query.pageSize };
      }

      const where = and(
        isNull(patients.deletedAt),
        idFilter ? inArray(patients.id, idFilter) : undefined,
      );
      const { limit, offset } = pageWindow(query);
      const order = orderClause(query);

      const [totalRow, rows] = await Promise.all([
        db
          .select({ n: sql<number>`count(*)` })
          .from(patients)
          .where(where)
          .get(),
        db
          .select({
            id: patients.id,
            code: patients.code,
            fullName: patients.fullName,
            gender: patients.gender,
            ageYearsAtReg: patients.ageYearsAtReg,
            dateOfBirth: patients.dateOfBirth,
            createdAt: patients.createdAt,
            mobile: patients.mobile,
            status: patients.status,
          })
          .from(patients)
          .where(where)
          .orderBy(...order)
          .limit(limit)
          .offset(offset)
          .all(),
      ]);

      return {
        rows: rows.map((r) => ({
          ...r,
          gender: r.gender as PatientGender,
          status: r.status as "active" | "archived",
        })),
        total: Number(totalRow?.n ?? 0),
        page: query.page,
        pageSize: query.pageSize,
      };
    },
  };
}

async function matchPatientIds(db: Db, words: string[]): Promise<string[]> {
  const first = words[0]!;
  const prefixes = [first];
  // Last-4 (and other digit tails) hit mobile_rev via the reversed prefix.
  if (/^\d+$/.test(first)) prefixes.push([...first].reverse().join(""));

  const ranges = prefixes.map((p) =>
    and(gte(patientSearch.token, p), lt(patientSearch.token, tokenRangeEnd(p))),
  );
  const rangeClause = ranges.length === 1 ? ranges[0]! : or(...ranges);

  const hits = await db
    .selectDistinct({ patientId: patientSearch.patientId, token: patientSearch.token })
    .from(patientSearch)
    .where(rangeClause)
    .limit(SEARCH_ID_CAP * 4)
    .all();

  const byPatient = new Map<string, Set<string>>();
  for (const h of hits) {
    let set = byPatient.get(h.patientId);
    if (!set) {
      set = new Set();
      byPatient.set(h.patientId, set);
    }
    set.add(h.token);
  }

  let ids = [...byPatient.keys()];
  if (words.length > 1) ids = await filterExtraWords(db, ids, words.slice(1));
  return ids.slice(0, SEARCH_ID_CAP);
}

async function filterExtraWords(db: Db, ids: string[], extra: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const nameRows = await db
    .select({ patientId: patientSearch.patientId, token: patientSearch.token })
    .from(patientSearch)
    .where(and(inArray(patientSearch.patientId, ids), eq(patientSearch.kind, "name")))
    .all();
  const names = new Map<string, string[]>();
  for (const r of nameRows) {
    const list = names.get(r.patientId) ?? [];
    list.push(r.token);
    names.set(r.patientId, list);
  }
  return ids.filter((id) => {
    const tokens = names.get(id) ?? [];
    return extra.every((w) => tokens.some((t) => t.startsWith(w) || t === w));
  });
}

function orderClause(query: PageQuery): SQL[] {
  const dir = query.dir === "desc" ? desc : asc;
  if (query.sort === "code") return [dir(patients.code)];
  if (query.sort === "created_at") return [dir(patients.createdAt)];
  if (query.sort === "full_name") return [dir(patients.fullName), asc(patients.code)];
  return [desc(patients.createdAt), asc(patients.code)];
}

export const PATIENT_LIST_SORTABLE = SORTABLE;

import { pageWindow, type Page, type PageQuery, type PatientGender } from "@clinic/shared";
import { and, asc, desc, isNull, like, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";

export type PatientListRow = {
  id: string;
  code: string;
  fullName: string;
  gender: PatientGender;
  ageYearsAtReg: number | null;
  dateOfBirth: string | null;
  mobile: string | null;
  status: "active" | "archived";
};

const SORTABLE = ["full_name", "code", "created_at"] as const;

// 1.1.7 / 2.2.5: list patients for the Patients screen. Search is a simple prefix/LIKE until 2.1.6
// search tokens replace it. Soft-deleted rows are hidden; archived stays visible when q matches.
export function patientsRepo(db: Db, ctx: Ctx) {
  return {
    async list(query: PageQuery): Promise<Page<PatientListRow>> {
      assertAllowed(ctx, "patients.view");
      const where = and(isNull(patients.deletedAt), searchClause(query.q));
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

function searchClause(q: string): SQL | undefined {
  if (!q) return undefined;
  const needle = q.replaceAll("%", "").replaceAll("_", "").trim();
  if (!needle) return undefined;
  const pattern = `%${needle}%`;
  return or(
    like(patients.fullName, pattern),
    like(patients.code, pattern),
    like(patients.mobile, pattern),
  );
}

function orderClause(query: PageQuery): SQL[] {
  const dir = query.dir === "desc" ? desc : asc;
  if (query.sort === "code") return [dir(patients.code)];
  if (query.sort === "created_at") return [dir(patients.createdAt)];
  // Default and full_name: recent registration first when no sort (mockup "haal me aaye").
  if (query.sort === "full_name") return [dir(patients.fullName), asc(patients.code)];
  return [desc(patients.createdAt), asc(patients.code)];
}

export const PATIENT_LIST_SORTABLE = SORTABLE;

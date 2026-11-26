import {
  istDate,
  NEXT_APPOINTMENT_STATUSES,
  pageWindow,
  pickNextAppointment,
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
import { appointments, patients, patientSearch, visits } from "../schema";

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
  /** Q2.6: day of the latest visit that is not entered in error (a date only, nothing clinical). */
  lastVisitOn: string | null;
  /** Q2.6: the one shared "next appointment" rule (appointment-next.ts). */
  nextAppointment: { dateLocal: string; startMin: number } | null;
};

const SORTABLE = ["full_name", "code", "created_at"] as const;
/** Hard cap on ids from the token index before loading patient rows (plan budget). */
const SEARCH_ID_CAP = 100;

/** A list row before the last visit and next appointment are added. */
export type PatientListBaseRow = Omit<PatientListRow, "lastVisitOn" | "nextAppointment">;
export type VisitAndNext = {
  last: Map<string, string>;
  next: Map<string, { dateLocal: string; startMin: number }>;
};

export type PatientListStatus = "active" | "archived" | "all";

/** 2.2.5: quick filters. inactive_6m uses registration day until appointments exist (2.3). */
export type PatientListFilter = "new_month" | "inactive_6m";

export type PatientListOptions = {
  /** Default active (2.1.8): archived hidden unless asked for. */
  status?: PatientListStatus;
  filter?: PatientListFilter | null;
  /** Only these patients (the Balance due filter passes the ids that owe money). */
  onlyIds?: string[];
  /** Clock for month / 6-month bounds (tests inject a fixed instant). */
  now?: Date;
};

// 2.1.6: list uses patient_search range on the first word; extra words filter in memory.
// Soft-deleted rows are hidden. Archived hidden by default (2.1.8).
export function patientsRepo(db: Db, ctx: Ctx) {
  /** The page itself (count and rows together). S3.4.1: callers that also need dues use this. */
  async function listPage(
    query: PageQuery,
    options: PatientListOptions = {},
  ): Promise<Page<PatientListBaseRow>> {
    assertAllowed(ctx, "patients.view");
    const status = options.status ?? "active";
    const words = searchWords(query.q);
    const idFilter = words.length > 0 ? await matchPatientIds(db, words) : null;
    if (idFilter !== null && idFilter.length === 0) {
      return { rows: [], total: 0, page: query.page, pageSize: query.pageSize };
    }

    const now = options.now ?? new Date();
    const where = and(
      isNull(patients.deletedAt),
      status === "all"
        ? undefined
        : eq(patients.status, status === "archived" ? "archived" : "active"),
      idFilter ? inArray(patients.id, idFilter) : undefined,
      options.onlyIds ? inArray(patients.id, options.onlyIds) : undefined,
      filterClause(options.filter ?? null, now),
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
  }

  /** Last visit day and next appointment for these patients (chunks run together). */
  async function visitAndNextFor(ids: string[], now: Date = new Date()): Promise<VisitAndNext> {
    assertAllowed(ctx, "patients.view");
    return visitAndNext(db, ids, now);
  }

  async function list(
    query: PageQuery,
    options: PatientListOptions = {},
  ): Promise<Page<PatientListRow>> {
    const page = await listPage(query, options);
    const extra = await visitAndNextFor(
      page.rows.map((r) => r.id),
      options.now,
    );
    return {
      ...page,
      rows: page.rows.map((r) => ({
        ...r,
        lastVisitOn: extra.last.get(r.id) ?? null,
        nextAppointment: extra.next.get(r.id) ?? null,
      })),
    };
  }

  return { listPage, visitAndNext: visitAndNextFor, list };
}

/** Patient ids for typed search words (name words, code, mobile; also used by the calendar search). */
export async function matchPatientIds(db: Db, words: string[]): Promise<string[]> {
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

function filterClause(filter: PatientListFilter | null, now: Date): SQL | undefined {
  if (filter === "new_month") {
    return gte(patients.createdAt, istMonthStartUtcIso(now));
  }
  if (filter === "inactive_6m") {
    // Q2.6: registered more than 6 months ago and no visit (not entered in error) since then.
    const cutoff = istDate(new Date(monthsAgoUtcIso(now, 6)));
    return and(
      lt(patients.createdAt, monthsAgoUtcIso(now, 6)),
      sql`not exists (select 1 from ${visits} where ${visits.patientId} = ${patients.id} and ${visits.deletedAt} is null and ${visits.status} != 'void' and ${visits.visitDateLocal} >= ${cutoff})`,
    );
  }
  return undefined;
}

/** Last visit day and next appointment for the patients on one page (two small queries). */
async function visitAndNext(db: Db, allIds: string[], now: Date): Promise<VisitAndNext> {
  const last = new Map<string, string>();
  const next = new Map<string, { dateLocal: string; startMin: number }>();
  // D1 takes at most 100 bound values per query: chunks of 40, all sent together.
  const chunks: string[][] = [];
  for (let i = 0; i < allIds.length; i += 40) chunks.push(allIds.slice(i, i + 40));
  await Promise.all(chunks.map((ids) => visitAndNextChunk(db, ids, now, last, next)));
  return { last, next };
}

async function visitAndNextChunk(
  db: Db,
  ids: string[],
  now: Date,
  last: Map<string, string>,
  next: Map<string, { dateLocal: string; startMin: number }>,
) {
  const lastQuery = db
    .select({ patientId: visits.patientId, day: sql<string>`max(${visits.visitDateLocal})` })
    .from(visits)
    .where(
      and(
        inArray(visits.patientId, ids),
        isNull(visits.deletedAt),
        sql`${visits.status} != 'void'`,
      ),
    )
    .groupBy(visits.patientId)
    .all();
  const apptQuery = db
    .select({
      patientId: appointments.patientId,
      status: appointments.status,
      dateLocal: appointments.dateLocal,
      startMin: appointments.startMin,
    })
    .from(appointments)
    .where(
      and(
        inArray(appointments.patientId, ids),
        isNull(appointments.deletedAt),
        gte(appointments.dateLocal, istDate(now)),
        inArray(appointments.status, [...NEXT_APPOINTMENT_STATUSES]),
      ),
    )
    .all();
  const [lastRows, apptRows] = await Promise.all([lastQuery, apptQuery]);
  for (const r of lastRows) last.set(r.patientId, r.day);
  const byPatient = new Map<string, typeof apptRows>();
  for (const a of apptRows) byPatient.set(a.patientId, [...(byPatient.get(a.patientId) ?? []), a]);
  for (const [id, list] of byPatient) {
    const pick = pickNextAppointment(list, now);
    if (pick) next.set(id, { dateLocal: pick.dateLocal, startMin: pick.startMin });
  }
}

/** UTC ISO of IST calendar month start (00:00 IST on the 1st). */
export function istMonthStartUtcIso(now: Date): string {
  const [y, m] = istDate(now).split("-").map(Number) as [number, number];
  const istMidnightMs = Date.UTC(y, m - 1, 1, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000;
  return new Date(istMidnightMs).toISOString();
}

export function monthsAgoUtcIso(now: Date, months: number): string {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

export const PATIENT_LIST_SORTABLE = SORTABLE;

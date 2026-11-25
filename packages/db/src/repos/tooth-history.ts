import {
  actionForFileKind,
  babyPredecessor,
  FILE_KINDS,
  isFdiTooth,
  istDate,
  mergeToothHistory,
  parseHistoryCursor,
  permanentSuccessor,
  TOOTH_HISTORY_PAGE,
  type ToothHistoryEntry,
  type ToothHistoryRow,
} from "@clinic/shared";
import { and, desc, eq, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import {
  files,
  patients,
  planItems,
  toothEvents,
  toothNotes,
  visitDiagnoses,
  visitProcedures,
  visits,
} from "../schema";
import { parseSurfaces } from "./visit-line-parts";

const ASK = TOOTH_HISTORY_PAGE + 1;

export type ToothHistory = {
  toothFdi: number;
  /** The tooth numbers read: this tooth and, for a permanent tooth, the baby tooth it replaced. */
  teeth: number[];
  entries: ToothHistoryEntry[];
  /** Cursor for "Show older", or null. */
  next: string | null;
  /** Plan items on these teeth, any status (shown in the card's Treatment plan box). */
  plan: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
  }[];
  note: { id: string; body: string; version: number; updatedAt: string } | null;
  /** Baby tooth only: the permanent tooth that replaces it, when that one has any record. */
  permanentTooth: number | null;
};

// B10: one read for the tooth card. Six queries in ONE db.batch (seven for a baby tooth).
// Finished work only: procedures and diagnoses from final visits and from today's draft, never
// from void visits or soft-deleted lines. Doctor only (clinical.view).
export function toothHistoryRepo(db: Db, ctx: Ctx) {
  return {
    async get(
      patientId: string,
      toothFdi: number,
      opts: { before?: string | null; now?: Date } = {},
    ): Promise<ToothHistory> {
      assertAllowed(ctx, "clinical.view");
      if (!isFdiTooth(toothFdi)) {
        throw new InvalidError("Tooth number must be a valid FDI number such as 36 or 85.");
      }
      const cursor = parseHistoryCursor(opts.before);
      if (opts.before && !cursor) throw new InvalidError("That page of history does not exist.");

      const today = istDate(opts.now ?? new Date());
      const baby = babyPredecessor(toothFdi);
      const successor = permanentSuccessor(toothFdi);
      const teeth = baby === null ? [toothFdi] : [toothFdi, baby];
      const kinds = FILE_KINDS.filter((k) => {
        const action = actionForFileKind(k);
        return action ? isAllowed(ctx.role, action) : false;
      });

      // Strictly older than the cursor: (time, id) pairs sort the same way as the merge.
      const olderThan = (at: AnySQLiteColumn, id: AnySQLiteColumn): SQL | undefined =>
        cursor ? or(lt(at, cursor.at), and(eq(at, cursor.at), lt(id, cursor.id))) : undefined;
      const liveVisit = or(
        eq(visits.status, "final"),
        and(eq(visits.status, "draft"), eq(visits.visitDateLocal, today)),
      );

      const qEvents = db
        .select({
          id: toothEvents.id,
          at: toothEvents.notedAt,
          toothFdi: toothEvents.toothFdi,
          surface: toothEvents.surface,
          code: toothEvents.conditionCode,
          visitId: toothEvents.visitId,
          visitStatus: visits.status,
        })
        .from(toothEvents)
        .leftJoin(visits, eq(visits.id, toothEvents.visitId))
        .where(
          and(
            eq(toothEvents.patientId, patientId),
            inArray(toothEvents.toothFdi, teeth),
            isNull(toothEvents.deletedAt),
            or(isNull(visits.status), ne(visits.status, "void")),
            olderThan(toothEvents.notedAt, toothEvents.id),
          ),
        )
        .orderBy(desc(toothEvents.notedAt), desc(toothEvents.id))
        .limit(ASK);

      const qProcs = db
        .select({
          id: visitProcedures.id,
          at: visitProcedures.createdAt,
          toothFdi: visitProcedures.toothFdi,
          label: visitProcedures.label,
          surfacesJson: visitProcedures.surfacesJson,
          note: visitProcedures.note,
          visitId: visitProcedures.visitId,
          visitStatus: visits.status,
        })
        .from(visitProcedures)
        .innerJoin(visits, eq(visits.id, visitProcedures.visitId))
        .where(
          and(
            eq(visits.patientId, patientId),
            isNull(visits.deletedAt),
            liveVisit,
            inArray(visitProcedures.toothFdi, teeth),
            isNull(visitProcedures.deletedAt),
            olderThan(visitProcedures.createdAt, visitProcedures.id),
          ),
        )
        .orderBy(desc(visitProcedures.createdAt), desc(visitProcedures.id))
        .limit(ASK);

      const qDiags = db
        .select({
          id: visitDiagnoses.id,
          at: visitDiagnoses.createdAt,
          toothFdi: visitDiagnoses.toothFdi,
          label: visitDiagnoses.label,
          visitId: visitDiagnoses.visitId,
          visitStatus: visits.status,
        })
        .from(visitDiagnoses)
        .innerJoin(visits, eq(visits.id, visitDiagnoses.visitId))
        .where(
          and(
            eq(visits.patientId, patientId),
            isNull(visits.deletedAt),
            liveVisit,
            inArray(visitDiagnoses.toothFdi, teeth),
            isNull(visitDiagnoses.deletedAt),
            olderThan(visitDiagnoses.createdAt, visitDiagnoses.id),
          ),
        )
        .orderBy(desc(visitDiagnoses.createdAt), desc(visitDiagnoses.id))
        .limit(ASK);

      const qFiles = db
        .select({
          id: files.id,
          at: files.createdAt,
          toothFdi: files.toothFdi,
          name: files.originalFilename,
          caption: files.caption,
        })
        .from(files)
        .where(
          and(
            eq(files.patientId, patientId),
            inArray(files.toothFdi, teeth),
            inArray(files.kind, kinds),
            isNull(files.deletedAt),
            olderThan(files.createdAt, files.id),
          ),
        )
        .orderBy(desc(files.createdAt), desc(files.id))
        .limit(ASK);

      const qPlan = db
        .select({
          id: planItems.id,
          toothFdi: planItems.toothFdi,
          procedureLabel: planItems.procedureLabel,
          status: planItems.status,
          sittings: planItems.sittings,
        })
        .from(planItems)
        .where(
          and(
            eq(planItems.patientId, patientId),
            inArray(planItems.toothFdi, teeth),
            isNull(planItems.deletedAt),
          ),
        )
        .orderBy(desc(planItems.createdAt))
        .limit(TOOTH_HISTORY_PAGE);

      const qNote = db
        .select({
          id: toothNotes.id,
          body: toothNotes.body,
          version: toothNotes.version,
          updatedAt: toothNotes.updatedAt,
        })
        .from(toothNotes)
        .where(
          and(
            eq(toothNotes.patientId, patientId),
            eq(toothNotes.toothFdi, toothFdi),
            isNull(toothNotes.deletedAt),
          ),
        );

      // Baby tooth only: does the permanent tooth that replaces it have anything on record?
      const qLink =
        successor === null
          ? null
          : db
              .select({
                any: sql<number>`(
                  EXISTS (SELECT 1 FROM tooth_events WHERE patient_id = ${patientId}
                    AND tooth_fdi = ${successor} AND deleted_at IS NULL)
                  OR EXISTS (SELECT 1 FROM visit_procedures vp JOIN visits v ON v.id = vp.visit_id
                    WHERE v.patient_id = ${patientId} AND vp.tooth_fdi = ${successor}
                    AND vp.deleted_at IS NULL AND v.deleted_at IS NULL AND v.status = 'final')
                  OR EXISTS (SELECT 1 FROM visit_diagnoses d JOIN visits v ON v.id = d.visit_id
                    WHERE v.patient_id = ${patientId} AND d.tooth_fdi = ${successor}
                    AND d.deleted_at IS NULL AND v.deleted_at IS NULL AND v.status = 'final')
                  OR EXISTS (SELECT 1 FROM files WHERE patient_id = ${patientId}
                    AND tooth_fdi = ${successor} AND deleted_at IS NULL))`,
              })
              .from(patients)
              .where(eq(patients.id, patientId));

      const base = [qEvents, qProcs, qDiags, qFiles, qPlan, qNote] as const;
      const out = (await (qLink ? db.batch([...base, qLink]) : db.batch([...base]))) as unknown[];
      const events = out[0] as Awaited<typeof qEvents>;
      const procs = out[1] as Awaited<typeof qProcs>;
      const diags = out[2] as Awaited<typeof qDiags>;
      const fileRows = out[3] as Awaited<typeof qFiles>;
      const plan = out[4] as Awaited<typeof qPlan>;
      const note = (out[5] as Awaited<typeof qNote>)[0] ?? null;
      const link = qLink ? ((out[6] as { any: number }[])[0]?.any ?? 0) : 0;

      const row = (
        r: Partial<ToothHistoryRow> &
          Pick<ToothHistoryRow, "id" | "at" | "kind" | "toothFdi" | "title">,
      ): ToothHistoryRow => ({
        surfaces: [],
        note: null,
        visitId: null,
        isToday: false,
        fileId: null,
        ...r,
      });
      const merged = mergeToothHistory(
        [
          {
            truncated: events.length === ASK,
            rows: events.map((e) =>
              row({
                id: e.id,
                at: e.at,
                kind: "chart",
                toothFdi: e.toothFdi,
                title: e.code,
                surfaces: [e.surface],
                visitId: e.visitId,
                isToday: e.visitId ? e.visitStatus === "draft" : istDate(new Date(e.at)) === today,
              }),
            ),
          },
          {
            truncated: procs.length === ASK,
            rows: procs.map((p) =>
              row({
                id: p.id,
                at: p.at,
                kind: "procedure",
                toothFdi: p.toothFdi as number,
                title: p.label,
                surfaces: parseSurfaces(p.surfacesJson),
                note: p.note,
                visitId: p.visitId,
                isToday: p.visitStatus === "draft",
              }),
            ),
          },
          {
            truncated: diags.length === ASK,
            rows: diags.map((d) =>
              row({
                id: d.id,
                at: d.at,
                kind: "diagnosis",
                toothFdi: d.toothFdi as number,
                title: d.label,
                visitId: d.visitId,
                isToday: d.visitStatus === "draft",
              }),
            ),
          },
          {
            truncated: fileRows.length === ASK,
            rows: fileRows.map((f) =>
              row({
                id: f.id,
                at: f.at,
                kind: "file",
                toothFdi: f.toothFdi as number,
                title: f.name,
                note: f.caption,
                fileId: f.id,
                isToday: istDate(new Date(f.at)) === today,
              }),
            ),
          },
        ],
        baby,
      );

      return {
        toothFdi,
        teeth,
        entries: merged.entries,
        next: merged.next,
        plan,
        note,
        permanentTooth: link ? successor : null,
      };
    },
  };
}

import {
  newUlid,
  type ApprovalItem,
  type ApprovalStatus,
  type ApprovalType,
  type CreateApprovalInput,
} from "@clinic/shared";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, approvalRequests as ar, bills, patients, users } from "../schema";

const CLOSED = "This request is already closed.";
const OPEN_LIST_LIMIT = 50;
const MINE_LIST_LIMIT = 20;

const selectItem = (db: Db) =>
  db
    .select({
      id: ar.id,
      type: ar.type,
      status: ar.status,
      appointmentId: ar.appointmentId,
      patientId: ar.patientId,
      billId: ar.billId,
      patientName: patients.fullName,
      patientCode: patients.code,
      note: ar.note,
      detail: ar.detail,
      urgent: ar.urgent,
      answerNote: ar.answerNote,
      answeredAt: ar.answeredAt,
      requestedByName: users.name,
      createdAt: ar.createdAt,
      version: ar.version,
    })
    .from(ar)
    .leftJoin(patients, eq(patients.id, ar.patientId))
    .leftJoin(users, eq(users.id, ar.createdBy));

const toItem = (
  r: Awaited<ReturnType<ReturnType<typeof selectItem>["all"]>>[number],
): ApprovalItem => ({
  ...r,
  type: r.type as ApprovalType,
  status: r.status as ApprovalStatus,
});

/**
 * Part T: the desk asks the doctor; the doctor answers Yes or No with a note. The answer is only
 * recorded (decision 9): approving does NOT change a bill, an appointment or a message.
 */
export function approvalRequestsRepo(db: Db, ctx: Ctx) {
  async function loadOpen(id: string, version: number) {
    const row = await db
      .select({ id: ar.id, status: ar.status, version: ar.version, createdBy: ar.createdBy })
      .from(ar)
      .where(and(eq(ar.id, id), isNull(ar.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("That request");
    if (row.status !== "open") throw new ConflictError(CLOSED);
    if (row.version !== version)
      throw new ConflictError("The request changed. Reload and try again.");
    return row;
  }

  // Closes an open request (answer or dismiss) in one batch with its audit row.
  async function close(
    id: string,
    version: number,
    status: Exclude<ApprovalStatus, "open">,
    answerNote: string | null,
    now: Date,
  ) {
    await loadOpen(id, version);
    const nowIso = now.toISOString();
    await db.batch([
      db
        .update(ar)
        .set({
          status,
          answerNote,
          answeredAt: nowIso,
          answeredBy: ctx.userId,
          version: sql`${ar.version} + 1`,
          updatedAt: nowIso,
          updatedBy: ctx.userId,
        })
        .where(and(eq(ar.id, id), eq(ar.version, version), eq(ar.status, "open"))),
      auditInsertIfChanged(db, ctx, {
        action: "update",
        table: "approval_requests",
        rowId: id,
        before: { status: "open", version },
        after: { status, answerNote, version: version + 1 },
      }),
    ]);
    const next = await db.select({ version: ar.version }).from(ar).where(eq(ar.id, id)).get();
    if (next?.version !== version + 1) throw new ConflictError(CLOSED);
    return { id, status, version: version + 1 };
  }

  return {
    /** Desk: ask the doctor. One open request per (type, appointment). */
    async createApproval(input: CreateApprovalInput): Promise<{ id: string }> {
      assertAllowed(ctx, "approvals.request");
      // The patient is filled in from the appointment or the bill, so the list needs no extra reads.
      let patientId = input.patientId ?? null;
      if (input.appointmentId) {
        const appt = await db
          .select({ patientId: appointments.patientId })
          .from(appointments)
          .where(and(eq(appointments.id, input.appointmentId), isNull(appointments.deletedAt)))
          .get();
        if (!appt) throw new NotFoundError("That appointment");
        patientId = patientId ?? appt.patientId;
      } else if (input.billId) {
        const bill = await db
          .select({ patientId: bills.patientId })
          .from(bills)
          .where(and(eq(bills.id, input.billId), isNull(bills.deletedAt)))
          .get();
        if (!bill) throw new NotFoundError("That bill");
        patientId = patientId ?? bill.patientId;
      }
      const id = newUlid();
      try {
        await db.batch([
          db.insert(ar).values({
            id,
            type: input.type,
            status: "open",
            appointmentId: input.appointmentId ?? null,
            patientId,
            billId: input.billId ?? null,
            note: input.note,
            detail: input.detail ?? null,
            urgent: input.urgent,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          auditInsert(db, ctx, {
            action: "create",
            table: "approval_requests",
            rowId: id,
            after: {
              type: input.type,
              appointmentId: input.appointmentId ?? null,
              urgent: input.urgent,
            },
          }),
        ]);
      } catch (err) {
        if (String(err).includes("UNIQUE")) {
          throw new ConflictError("A request for this is already waiting for the doctor.");
        }
        throw err;
      }
      return { id };
    },

    /** Doctor: open requests, urgent first, then oldest first. */
    async listOpenApprovals(): Promise<ApprovalItem[]> {
      assertAllowed(ctx, "approvals.answer");
      const rows = await selectItem(db)
        .where(and(eq(ar.status, "open"), isNull(ar.deletedAt)))
        .orderBy(desc(ar.urgent), asc(ar.createdAt))
        .limit(OPEN_LIST_LIMIT)
        .all();
      return rows.map(toItem);
    },

    /** Desk: my own requests, newest first, with the doctor's answer. */
    async listMyApprovals(): Promise<ApprovalItem[]> {
      assertAllowed(ctx, "approvals.request");
      const rows = await selectItem(db)
        .where(and(eq(ar.createdBy, ctx.userId), isNull(ar.deletedAt)))
        .orderBy(desc(ar.createdAt))
        .limit(MINE_LIST_LIMIT)
        .all();
      return rows.map(toItem);
    },

    /** Doctor: Yes or No, with an optional note. */
    async answerApproval(
      id: string,
      decision: "approve" | "reject",
      note: string | undefined,
      version: number,
      now: Date = new Date(),
    ) {
      assertAllowed(ctx, "approvals.answer");
      return close(
        id,
        version,
        decision === "approve" ? "approved" : "rejected",
        note || null,
        now,
      );
    },

    /** Doctor: the request is not needed (the X button). */
    async dismissApproval(id: string, version: number, now: Date = new Date()) {
      assertAllowed(ctx, "approvals.answer");
      return close(id, version, "dismissed", null, now);
    },

    /** Desk: take back my own open request (it leaves the doctor's list). */
    async withdrawApproval(id: string, now: Date = new Date()): Promise<void> {
      assertAllowed(ctx, "approvals.request");
      const row = await db
        .select({ status: ar.status, createdBy: ar.createdBy })
        .from(ar)
        .where(and(eq(ar.id, id), isNull(ar.deletedAt)))
        .get();
      if (!row || row.createdBy !== ctx.userId) throw new NotFoundError("That request");
      if (row.status !== "open") throw new ConflictError(CLOSED);
      const nowIso = now.toISOString();
      await db.batch([
        db
          .update(ar)
          .set({
            deletedAt: nowIso,
            version: sql`${ar.version} + 1`,
            updatedAt: nowIso,
            updatedBy: ctx.userId,
          })
          .where(and(eq(ar.id, id), eq(ar.status, "open"), isNull(ar.deletedAt))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "approval_requests",
          rowId: id,
          before: { status: "open" },
          after: { withdrawn: true },
        }),
      ]);
    },
  };
}

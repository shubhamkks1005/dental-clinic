import {
  canReorder,
  isAllowedStatusTransition,
  istDate,
  QUEUE_STEP,
  slotAboveForPull,
  swapTargetForSkip,
} from "@clinic/shared";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import {
  lastQueueOrder,
  loadQueueDay,
  planQueue,
  type QueueDayRow,
} from "./appointments-queue-plan";
import {
  queueWriter,
  STALE,
  type BatchItems,
  type QueueChange as Change,
  type QueueMoveResult,
} from "./appointments-queue-write";
import { markFirstArrivedBatch } from "./patient-first-arrived";

// The queue rules for the doctor list (Part T). Every move is ONE db.batch: the version-checked
// UPDATE(s) plus the audit row(s). Bills, payments and messages are never touched.
export type { QueueMoveResult };
export function appointmentsQueueRepo(db: Db, ctx: Ctx) {
  const { update, numberStatements, unchanged, result } = queueWriter(db, ctx);

  async function load(id: string, version: number) {
    assertAllowed(ctx, "appointments.manage");
    const rows = await loadQueueDay(db, id);
    const target = rows.find((r) => r.id === id);
    if (!target) throw new NotFoundError("That appointment");
    return { rows, target, stale: target.version !== version };
  }

  // One slot swap: the row moves to the other's number and the other takes its number.
  async function swap(
    id: string,
    version: number,
    pick: (ordered: QueueDayRow[], id: string) => QueueDayRow | null,
    targetChange: (target: QueueDayRow, nowIso: string) => Change,
    refused: (target: QueueDayRow) => string | null,
    noPartner: string | "alone",
    now: Date,
  ): Promise<QueueMoveResult> {
    const { rows, target, stale } = await load(id, version);
    const why = refused(target);
    if (why) throw new ConflictError(why);
    if (stale) throw new ConflictError(STALE);
    const plan = planQueue(rows);
    const me = plan.ordered.find((r) => r.id === id) as QueueDayRow;
    const partner = pick(plan.ordered, id);
    if (!partner && noPartner !== "alone") throw new ConflictError(noPartner);
    const nowIso = now.toISOString();
    const base = targetChange(me, nowIso);
    const myOrder = me.queueOrder as number;

    if (!partner) {
      // Last unfinished row: nothing to swap with, only the flag changes.
      await db.batch([
        ...numberStatements(plan),
        ...update(me, version, myOrder, base, nowIso),
      ] as unknown as BatchItems);
      return result(id, version, null);
    }
    const partnerOrder = partner.queueOrder as number;
    await db.batch([
      ...numberStatements(plan),
      ...update(
        me,
        version,
        myOrder,
        { ...base, queueOrder: partnerOrder },
        nowIso,
        unchanged("nb", partner.id, partner.version, partnerOrder),
      ),
      ...update(
        partner,
        partner.version,
        partnerOrder,
        { queueOrder: myOrder },
        nowIso,
        unchanged("tg", id, version + 1, partnerOrder),
      ),
    ] as unknown as BatchItems);
    return result(id, version, {
      id: partner.id,
      version: partner.version + 1,
      queueOrder: myOrder,
    });
  }

  return {
    /** Skip: one slot down (swap with the next unfinished row), marked Stepped out. */
    skip: (id: string, version: number, now: Date = new Date()) =>
      swap(
        id,
        version,
        swapTargetForSkip,
        (t, nowIso) => ({ steppedOutAt: nowIso, skipCount: t.skipCount + 1 }),
        (t) =>
          canReorder(t.status) ? null : "Only a patient who is not in the chair can be skipped.",
        "alone",
        now,
      ),

    /** Pull forward: one slot up. */
    pullForward: (id: string, version: number, now: Date = new Date()) =>
      swap(
        id,
        version,
        slotAboveForPull,
        () => ({}),
        (t) => (canReorder(t.status) ? null : "This patient cannot be moved."),
        "Already first in the list.",
        now,
      ),

    /** Stepped out without moving (the light form of Skip). */
    async stepOut(id: string, version: number, now: Date = new Date()): Promise<QueueMoveResult> {
      const { rows, target, stale } = await load(id, version);
      if (!canReorder(target.status)) throw new ConflictError("This patient cannot be moved.");
      if (stale) throw new ConflictError(STALE);
      const plan = planQueue(rows);
      const me = plan.ordered.find((r) => r.id === id) as QueueDayRow;
      const nowIso = now.toISOString();
      await db.batch([
        ...numberStatements(plan),
        ...update(me, version, me.queueOrder, { steppedOutAt: nowIso }, nowIso),
      ] as unknown as BatchItems);
      return result(id, version, null);
    },

    /** Back: the patient is here again. Stepped out is cleared; Not arrived becomes Arrived. */
    async stepBack(id: string, version: number, now: Date = new Date()): Promise<QueueMoveResult> {
      const { rows, target, stale } = await load(id, version);
      if (!canReorder(target.status)) throw new ConflictError("This patient cannot be moved.");
      if (stale) throw new ConflictError(STALE);
      const plan = planQueue(rows);
      const me = plan.ordered.find((r) => r.id === id) as QueueDayRow;
      const nowIso = now.toISOString();
      const arrives = isAllowedStatusTransition(me.status, "arrived") && me.status !== "arrived";
      const change: Change = arrives
        ? { steppedOutAt: null, status: "arrived", arrivedAt: nowIso }
        : { steppedOutAt: null };
      const first = arrives
        ? markFirstArrivedBatch(db, ctx, me.patientId, istDate(now), nowIso)
        : [];
      await db.batch([
        ...numberStatements(plan),
        ...update(me, version, me.queueOrder, change, nowIso),
        ...first,
      ] as unknown as BatchItems);
      return result(id, version, null);
    },

    /** Late, coming today: the same appointment goes to the back of the list. No new bill. */
    async markLateToday(
      id: string,
      version: number,
      now: Date = new Date(),
    ): Promise<QueueMoveResult> {
      const { rows, target, stale } = await load(id, version);
      if (!canReorder(target.status)) {
        throw new ConflictError("Only a patient who is not in the chair can be marked late.");
      }
      if (stale) throw new ConflictError(STALE);
      const plan = planQueue(rows);
      const me = plan.ordered.find((r) => r.id === id) as QueueDayRow;
      const nowIso = now.toISOString();
      const last = lastQueueOrder(plan.ordered.filter((r) => r.id !== id));
      await db.batch([
        ...numberStatements(plan),
        ...update(
          me,
          version,
          me.queueOrder,
          { lateAt: nowIso, steppedOutAt: null, queueOrder: last + QUEUE_STEP },
          nowIso,
        ),
      ] as unknown as BatchItems);
      return result(id, version, null);
    },
  };
}

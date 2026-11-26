import {
  newUlid,
  type CurrentBreak,
  type DayLeave,
  type DoctorLeave,
  type DoctorLeaveInput,
} from "@clinic/shared";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotAllowedError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { doctorLeaves, users } from "../schema";
import { openBreaksQuery, toCurrentBreak } from "./doctor-breaks";

const MSG = {
  onlySelf: "You can add or remove only your own leave days.",
  taken: "That doctor already has leave on that day.",
};

// Doctor leave (owner 2026-11-26, Q4): entered in Settings > Timings. A doctor manages their own
// days; a doctor with settings.write may manage any doctor's. The desk only reads them.
export function doctorLeavesRepo(db: Db, ctx: Ctx) {
  function mayManage(doctorId: string) {
    assertAllowed(ctx, "breaks.manage");
    const ownOnly = !isAllowed(ctx.role, "settings.write");
    if (ownOnly && doctorId !== ctx.userId) throw new NotAllowedError(MSG.onlySelf);
  }

  const listQuery = (from: string, to: string) =>
    db
      .select({
        id: doctorLeaves.id,
        doctorId: doctorLeaves.doctorId,
        doctorName: users.name,
        dateLocal: doctorLeaves.dateLocal,
        note: doctorLeaves.note,
        version: doctorLeaves.version,
      })
      .from(doctorLeaves)
      .innerJoin(users, eq(users.id, doctorLeaves.doctorId))
      .where(
        and(
          isNull(doctorLeaves.deletedAt),
          gte(doctorLeaves.dateLocal, from),
          lte(doctorLeaves.dateLocal, to),
        ),
      )
      .orderBy(asc(doctorLeaves.dateLocal), asc(users.name));

  /** Every live leave day between two IST dates, with the doctor's name. */
  async function list(from: string, to: string): Promise<DoctorLeave[]> {
    assertAllowed(ctx, "appointments.manage");
    return listQuery(from, to).all();
  }

  function groupByDay(rows: DoctorLeave[]): Map<string, DayLeave[]> {
    const out = new Map<string, DayLeave[]>();
    for (const r of rows) {
      const day = out.get(r.dateLocal) ?? [];
      day.push({ doctorId: r.doctorId, doctorName: r.doctorName });
      out.set(r.dateLocal, day);
    }
    return out;
  }

  return {
    list,

    /** The calendar's per-day lines "Dr X on leave" (one read for the whole range). */
    async byDay(from: string, to: string): Promise<Map<string, DayLeave[]>> {
      return groupByDay(await list(from, to));
    },

    /**
     * Leave days plus the breaks on now (when breakDay is today), in ONE round trip, so the day
     * list stays within the 10-reads rule (docs/PERFORMANCE rules).
     */
    async withOpenBreaks(
      from: string,
      to: string,
      breakDay: string | null,
    ): Promise<{ leaves: Map<string, DayLeave[]>; openBreaks: CurrentBreak[] }> {
      assertAllowed(ctx, "appointments.manage");
      if (!breakDay) return { leaves: groupByDay(await listQuery(from, to).all()), openBreaks: [] };
      const [leaves, breaks] = await db.batch([
        listQuery(from, to),
        openBreaksQuery(db, ctx, breakDay),
      ]);
      return { leaves: groupByDay(leaves), openBreaks: breaks.map(toCurrentBreak) };
    },

    async add(input: DoctorLeaveInput): Promise<{ id: string }> {
      mayManage(input.doctorId);
      const doctor = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, input.doctorId),
            eq(users.role, "doctor"),
            eq(users.status, "active"),
            isNull(users.deletedAt),
          ),
        )
        .get();
      if (!doctor) throw new NotFoundError("That doctor");
      const id = newUlid();
      try {
        await db.batch([
          db.insert(doctorLeaves).values({
            id,
            doctorId: input.doctorId,
            dateLocal: input.dateLocal,
            note: input.note,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          auditInsert(db, ctx, {
            action: "create",
            table: "doctor_leaves",
            rowId: id,
            after: { doctorId: input.doctorId, dateLocal: input.dateLocal, note: input.note },
          }),
        ]);
      } catch (err) {
        if (String(err).includes("UNIQUE")) throw new ConflictError(MSG.taken);
        throw err;
      }
      return { id };
    },

    /** Soft delete, version-checked. */
    async remove(id: string, version: number, now: Date = new Date()): Promise<void> {
      const row = await db
        .select()
        .from(doctorLeaves)
        .where(and(eq(doctorLeaves.id, id), isNull(doctorLeaves.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That leave day");
      mayManage(row.doctorId);
      const nowIso = now.toISOString();
      await db.batch([
        db
          .update(doctorLeaves)
          .set({
            deletedAt: nowIso,
            updatedAt: nowIso,
            updatedBy: ctx.userId,
            version: sql`${doctorLeaves.version} + 1`,
          })
          .where(
            and(
              eq(doctorLeaves.id, id),
              eq(doctorLeaves.version, version),
              isNull(doctorLeaves.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "delete",
          table: "doctor_leaves",
          rowId: id,
          before: { doctorId: row.doctorId, dateLocal: row.dateLocal, version },
        }),
      ]);
      const after = await db
        .select({ deletedAt: doctorLeaves.deletedAt })
        .from(doctorLeaves)
        .where(eq(doctorLeaves.id, id))
        .get();
      if (!after?.deletedAt) throw new ConflictError();
    },
  };
}

import {
  BREAK_MAX_MINUTES,
  BREAK_MIN_MINUTES,
  istDate,
  newUlid,
  type CurrentBreak,
  type StartBreakInput,
} from "@clinic/shared";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, doctorBreaks, users } from "../schema";

const columns = {
  id: doctorBreaks.id,
  startedAt: doctorBreaks.startedAt,
  dateLocal: doctorBreaks.dateLocal,
  minutes: doctorBreaks.minutes,
  label: doctorBreaks.label,
  endedAt: doctorBreaks.endedAt,
  version: doctorBreaks.version,
  doctorId: doctorBreaks.doctorId,
};

export const toCurrentBreak = (r: {
  id: string;
  startedAt: string;
  minutes: number;
  label: string;
  version: number;
  doctorId: string | null;
  doctorName?: string | null;
}): CurrentBreak => ({
  id: r.id,
  startedAt: r.startedAt,
  minutes: r.minutes,
  label: r.label,
  version: r.version,
  doctorId: r.doctorId,
  doctorName: r.doctorName ?? null,
});

const openOn = (dateLocal: string) =>
  and(
    eq(doctorBreaks.dateLocal, dateLocal),
    isNull(doctorBreaks.endedAt),
    isNull(doctorBreaks.deletedAt),
  );

/** Not run yet, so the calendar can batch it with the leave read (one round trip). */
export function openBreaksQuery(db: Db, ctx: Ctx, dateLocal: string) {
  const mine =
    ctx.role === "doctor"
      ? or(eq(doctorBreaks.doctorId, ctx.userId), isNull(doctorBreaks.doctorId))
      : undefined;
  return db
    .select({ ...columns, doctorName: users.name })
    .from(doctorBreaks)
    .leftJoin(users, eq(users.id, doctorBreaks.doctorId))
    .where(and(openOn(dateLocal), mine))
    .orderBy(doctorBreaks.startedAt);
}

/**
 * The doctor's own break. It never moves, reschedules or cancels an appointment (owner decision 1).
 * Only the doctor starts, changes or ends it; both roles may read it (the desk shows "on break").
 * Each doctor has their own break (owner 2026-11-26); a doctor only touches their own.
 */
export function doctorBreaksRepo(db: Db, ctx: Ctx) {
  async function load(id: string) {
    const row = await db
      .select(columns)
      .from(doctorBreaks)
      .where(and(eq(doctorBreaks.id, id), isNull(doctorBreaks.deletedAt)))
      .get();
    // Old rows have no doctor; anyone may close them. Another doctor's break is not found.
    if (!row || (row.doctorId !== null && row.doctorId !== ctx.userId)) {
      throw new NotFoundError("That break");
    }
    return row;
  }

  async function reload(id: string, version: number): Promise<CurrentBreak> {
    const next = await load(id);
    if (next.version !== version + 1) {
      throw new ConflictError("The break changed. Reload and try again.");
    }
    return toCurrentBreak(next);
  }

  /**
   * Breaks on today (an open break from an earlier day does not count). A doctor gets only
   * their own; the desk gets every doctor's, with the name, for "Dr X is on break".
   */
  async function openBreaks(dateLocal: string): Promise<CurrentBreak[]> {
    assertAllowed(ctx, "appointments.manage");
    const rows = await openBreaksQuery(db, ctx, dateLocal);
    return rows.map(toCurrentBreak);
  }

  return {
    async startBreak(input: StartBreakInput, now: Date = new Date()): Promise<CurrentBreak> {
      assertAllowed(ctx, "breaks.manage");
      const day = istDate(now);
      const [inChair, open] = await Promise.all([
        db
          .select({ id: appointments.id })
          .from(appointments)
          .where(
            and(
              eq(appointments.dateLocal, day),
              eq(appointments.status, "in_chair"),
              isNull(appointments.deletedAt),
              // Own chair only; old rows with no doctor count for everyone.
              or(eq(appointments.doctorId, ctx.userId), isNull(appointments.doctorId)),
            ),
          )
          .get(),
        db
          .select({ id: doctorBreaks.id })
          .from(doctorBreaks)
          .where(and(openOn(day), eq(doctorBreaks.doctorId, ctx.userId)))
          .get(),
      ]);
      if (inChair) throw new ConflictError("Finish the visit in the chair first.");
      if (open) throw new ConflictError("A break is already on.");

      const id = newUlid();
      const row = {
        id,
        doctorId: ctx.userId,
        startedAt: now.toISOString(),
        dateLocal: day,
        minutes: input.minutes,
        label: input.label ?? "Break",
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };
      try {
        await db.batch([
          db.insert(doctorBreaks).values(row),
          auditInsert(db, ctx, {
            action: "create",
            table: "doctor_breaks",
            rowId: id,
            after: { minutes: row.minutes, label: row.label, dateLocal: day },
          }),
        ]);
      } catch (err) {
        // Two taps at once: the one-open-break index refuses the second.
        if (String(err).includes("UNIQUE")) throw new ConflictError("A break is already on.");
        throw err;
      }
      return toCurrentBreak({ ...row, version: 1 });
    },

    /** +5 or -5 minutes while the break is on. */
    async adjustBreak(
      id: string,
      deltaMinutes: number,
      version: number,
      now: Date = new Date(),
    ): Promise<CurrentBreak> {
      assertAllowed(ctx, "breaks.manage");
      const row = await load(id);
      if (row.endedAt) throw new ConflictError("That break is already over.");
      if (row.version !== version)
        throw new ConflictError("The break changed. Reload and try again.");
      const minutes = row.minutes + deltaMinutes;
      if (minutes < BREAK_MIN_MINUTES || minutes > BREAK_MAX_MINUTES) {
        throw new InvalidError(
          `A break must be between ${BREAK_MIN_MINUTES} and ${BREAK_MAX_MINUTES} minutes.`,
        );
      }
      await db.batch([
        db
          .update(doctorBreaks)
          .set({
            minutes,
            version: sql`${doctorBreaks.version} + 1`,
            updatedBy: ctx.userId,
            updatedAt: now.toISOString(),
          })
          .where(
            and(
              eq(doctorBreaks.id, id),
              eq(doctorBreaks.version, version),
              isNull(doctorBreaks.endedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "doctor_breaks",
          rowId: id,
          before: { minutes: row.minutes, version },
          after: { minutes, version: version + 1 },
        }),
      ]);
      return reload(id, version);
    },

    /** "I'm back". Also closes a break the doctor forgot on an earlier day. */
    async endBreak(id: string, version: number, now: Date = new Date()): Promise<void> {
      assertAllowed(ctx, "breaks.manage");
      const row = await load(id);
      if (row.endedAt) throw new ConflictError("That break is already over.");
      if (row.version !== version)
        throw new ConflictError("The break changed. Reload and try again.");
      await db.batch([
        db
          .update(doctorBreaks)
          .set({
            endedAt: now.toISOString(),
            version: sql`${doctorBreaks.version} + 1`,
            updatedBy: ctx.userId,
            updatedAt: now.toISOString(),
          })
          .where(
            and(
              eq(doctorBreaks.id, id),
              eq(doctorBreaks.version, version),
              isNull(doctorBreaks.endedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "doctor_breaks",
          rowId: id,
          before: { endedAt: null, version },
          after: { endedAt: now.toISOString(), version: version + 1 },
        }),
      ]);
      await reload(id, version);
    },

    openBreaks,

    /** The signed-in doctor's own break today, or null (the desk: the first open one). */
    async currentBreak(dateLocal: string): Promise<CurrentBreak | null> {
      const all = await openBreaks(dateLocal);
      return all[0] ?? null;
    },
  };
}

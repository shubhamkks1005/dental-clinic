import type { Doctor } from "@clinic/shared";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotAllowedError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { doctorProfiles, users } from "../schema";

// Several doctors (owner 2026-11-26). The list is every ACTIVE user with role doctor, in the
// order they were added (that order also picks the colour). The owner adds doctors through
// Settings > Staff; a doctor with no letterhead profile yet simply has no specialty.
export function doctorsRepo(db: Db, ctx: Ctx) {
  return {
    async listActive(): Promise<Doctor[]> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select({ id: users.id, name: users.name, specialty: doctorProfiles.speciality })
        .from(users)
        .leftJoin(
          doctorProfiles,
          and(eq(doctorProfiles.userId, users.id), isNull(doctorProfiles.deletedAt)),
        )
        .where(and(eq(users.role, "doctor"), eq(users.status, "active"), isNull(users.deletedAt)))
        .orderBy(asc(users.createdAt), asc(users.id))
        .all();
      return rows.map((r, i) => ({
        id: r.id,
        name: r.name,
        specialty: r.specialty?.trim() || null,
        colourIndex: i,
      }));
    },
  };
}

export type BookingDoctor = { id: string; name: string; onLeave: boolean };

/**
 * One read for a booking: the doctor must be active, and a doctor may book only for themself
 * (owner Q3). onLeave feeds the soft rule "Dr X is on leave that day".
 */
export async function requireBookingDoctor(
  db: Db,
  ctx: Ctx,
  doctorId: string,
  dateLocal: string,
): Promise<BookingDoctor> {
  if (ctx.role === "doctor" && doctorId !== ctx.userId) {
    throw new NotAllowedError("You can book only for yourself.");
  }
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      onLeave: sql<number>`EXISTS (SELECT 1 FROM doctor_leaves l WHERE l.doctor_id = ${doctorId} AND l.date_local = ${dateLocal} AND l.deleted_at IS NULL)`,
    })
    .from(users)
    .where(
      and(
        eq(users.id, doctorId),
        eq(users.role, "doctor"),
        eq(users.status, "active"),
        isNull(users.deletedAt),
      ),
    )
    .get();
  if (!row) throw new NotFoundError("That doctor");
  return { id: row.id, name: row.name, onLeave: Boolean(row.onLeave) };
}

import { newUlid, type DoctorProfile, type DoctorProfileInput } from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotAllowedError } from "../errors";
import { assertAllowed } from "../permissions";
import { doctorProfiles } from "../schema";

const fields = {
  id: doctorProfiles.id,
  userId: doctorProfiles.userId,
  nameOnRx: doctorProfiles.nameOnRx,
  qualifications: doctorProfiles.qualifications,
  speciality: doctorProfiles.speciality,
  registrationNo: doctorProfiles.registrationNo,
  extraLine: doctorProfiles.extraLine,
  version: doctorProfiles.version,
};

/** Read without a permission check: print code of any role needs the visit doctor's lines. */
export async function loadDoctorProfile(db: Db, userId: string): Promise<DoctorProfile | null> {
  const row = await db
    .select(fields)
    .from(doctorProfiles)
    .where(and(eq(doctorProfiles.userId, userId), isNull(doctorProfiles.deletedAt)))
    .get();
  return row ?? null;
}

// Each doctor's own letterhead (owner 2026-11-26, Q1). Only the doctor edits their own row.
export function doctorProfilesRepo(db: Db, ctx: Ctx) {
  function onlyDoctor() {
    assertAllowed(ctx, "prescriptions.write");
    if (ctx.role !== "doctor") throw new NotAllowedError("Only a doctor has prescription details.");
  }

  return {
    async getMine(): Promise<DoctorProfile | null> {
      onlyDoctor();
      return loadDoctorProfile(db, ctx.userId);
    },

    getFor: (userId: string) => loadDoctorProfile(db, userId),

    /** version 0 = first save (insert); otherwise a version-checked update. */
    async saveMine(input: DoctorProfileInput, version: number, now = new Date()) {
      onlyDoctor();
      const before = await loadDoctorProfile(db, ctx.userId);
      const nowIso = now.toISOString();
      if (!before) {
        if (version !== 0) throw new ConflictError();
        const id = newUlid();
        try {
          await db.batch([
            db.insert(doctorProfiles).values({
              id,
              userId: ctx.userId,
              ...input,
              createdBy: ctx.userId,
              updatedBy: ctx.userId,
            }),
            auditInsert(db, ctx, {
              action: "create",
              table: "doctor_profiles",
              rowId: id,
              after: input,
            }),
          ]);
        } catch (err) {
          if (String(err).includes("UNIQUE")) throw new ConflictError();
          throw err;
        }
      } else {
        if (before.version !== version) throw new ConflictError();
        await db.batch([
          db
            .update(doctorProfiles)
            .set({
              ...input,
              updatedAt: nowIso,
              updatedBy: ctx.userId,
              version: sql`${doctorProfiles.version} + 1`,
            })
            .where(
              and(
                eq(doctorProfiles.userId, ctx.userId),
                eq(doctorProfiles.version, version),
                isNull(doctorProfiles.deletedAt),
              ),
            ),
          auditInsertIfChanged(db, ctx, {
            action: "update",
            table: "doctor_profiles",
            rowId: before.id,
            before,
            after: { ...input, version: version + 1 },
          }),
        ]);
      }
      const saved = await loadDoctorProfile(db, ctx.userId);
      if (!saved || saved.version !== version + 1) throw new ConflictError();
      return saved;
    },
  };
}

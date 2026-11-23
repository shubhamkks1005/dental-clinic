import { istDate, newUlid, type DuesCallInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { duesCalls, patients } from "../schema";

export function duesCallsRepo(db: Db, ctx: Ctx) {
  return {
    async record(
      patientId: string,
      input: DuesCallInput,
    ): Promise<{ id: string; calledOn: string }> {
      assertAllowed(ctx, "bills.create");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const id = newUlid();
      const calledOn = input.calledOn ?? istDate(new Date());
      await db.batch([
        db.insert(duesCalls).values({
          id,
          patientId,
          note: input.note,
          calledOn,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "dues_calls",
          rowId: id,
          after: { patientId, note: input.note, calledOn },
        }),
      ]);
      return { id, calledOn };
    },
  };
}

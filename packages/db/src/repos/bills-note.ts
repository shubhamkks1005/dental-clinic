import { BILL_NOTE_MAX, type BillNoteInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills } from "../schema";
import { nowUtcSql } from "../sql";
import { billsGetRepo, type BillRow } from "./bills-get";

// Visit finished page: the note stays with the bill and may be changed even after the bill is
// issued. Only the note moves: no money column is touched. A cancelled bill is refused.
export function billsNoteRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async setNote(id: string, input: BillNoteInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const note = input.note.trim();
      if (note.length > BILL_NOTE_MAX) {
        throw new InvalidError(`Keep the note under ${BILL_NOTE_MAX} characters.`);
      }
      const row = await db
        .select({ id: bills.id, status: bills.status, version: bills.version, notes: bills.notes })
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      if (row.status === "cancelled") {
        throw new InvalidError("This bill is cancelled. Its note cannot be changed.");
      }
      if (row.version !== input.version) throw new ConflictError();

      const results = await db.batch([
        db
          .update(bills)
          .set({
            notes: note,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(bills.id, id), eq(bills.version, input.version), eq(bills.status, row.status)),
          )
          .returning({ id: bills.id }),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { notes: row.notes },
          after: { notes: note },
        }),
      ]);
      if (!(results[0] as { id: string }[]).length) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}

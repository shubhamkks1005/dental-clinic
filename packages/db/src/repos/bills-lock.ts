import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills } from "../schema";

/** 5.2.7: refuse any field update on an issued/cancelled bill (repo layer). */
export function billsLockRepo(db: Db, ctx: Ctx) {
  return {
    async assertDraftEditable(id: string): Promise<void> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select({ status: bills.status })
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      if (row.status !== "draft") {
        throw new InvalidError("This bill is locked. Cancel it and create a new bill instead.");
      }
    },
  };
}

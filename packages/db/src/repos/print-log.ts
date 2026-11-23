import { newUlid, type PrintDocumentKind } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import type { Action } from "../permissions";
import { assertAllowed } from "../permissions";
import { printLog } from "../schema";

export type PrintLogRow = {
  id: string;
  documentKind: string;
  documentId: string;
  isReprint: boolean;
  printedAt: string;
  printedBy: string;
  copies: number;
};

function actionForKind(kind: PrintDocumentKind): Action {
  if (kind === "prescription") return "prescriptions.print";
  if (kind === "certificate") return "certificates.print";
  // Estimate sheet is clinical (plan) — doctor only (AUTH_PLAN 4f).
  if (kind === "estimate") return "clinical.view";
  if (kind === "bill" || kind === "receipt") return "bills.create";
  return "patients.view";
}

// 4.3.5: record each print; first copy is original, later copies are reprints.
export function printLogRepo(db: Db, ctx: Ctx) {
  return {
    async record(input: {
      documentKind: PrintDocumentKind;
      documentId: string;
      documentVersion?: number | null;
      copies?: number;
    }): Promise<{ entry: PrintLogRow; isReprint: boolean }> {
      assertAllowed(ctx, actionForKind(input.documentKind));

      const prior = await db
        .select({ id: printLog.id })
        .from(printLog)
        .where(
          and(
            eq(printLog.documentKind, input.documentKind),
            eq(printLog.documentId, input.documentId),
            isNull(printLog.deletedAt),
          ),
        )
        .limit(1)
        .get();
      const isReprint = Boolean(prior);
      const id = newUlid();
      const printedAt = new Date().toISOString();

      await db.batch([
        db.insert(printLog).values({
          id,
          documentKind: input.documentKind,
          documentId: input.documentId,
          documentVersion: input.documentVersion ?? null,
          copies: input.copies ?? 1,
          isReprint,
          printedAt,
          printedBy: ctx.userId,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "print_log",
          rowId: id,
          before: null,
          after: {
            documentKind: input.documentKind,
            documentId: input.documentId,
            isReprint,
          },
        }),
      ]);

      return {
        isReprint,
        entry: {
          id,
          documentKind: input.documentKind,
          documentId: input.documentId,
          isReprint,
          printedAt,
          printedBy: ctx.userId,
          copies: input.copies ?? 1,
        },
      };
    },

    async listForDocument(documentKind: string, documentId: string): Promise<PrintLogRow[]> {
      assertAllowed(ctx, "patients.view");
      const rows = await db
        .select()
        .from(printLog)
        .where(
          and(
            eq(printLog.documentKind, documentKind),
            eq(printLog.documentId, documentId),
            isNull(printLog.deletedAt),
          ),
        )
        .orderBy(asc(printLog.printedAt));
      return rows.map((r) => ({
        id: r.id,
        documentKind: r.documentKind,
        documentId: r.documentId,
        isReprint: r.isReprint,
        printedAt: r.printedAt,
        printedBy: r.printedBy,
        copies: r.copies,
      }));
    },

    async nextIsReprint(documentKind: string, documentId: string): Promise<boolean> {
      assertAllowed(ctx, "patients.view");
      const prior = await db
        .select({ id: printLog.id })
        .from(printLog)
        .where(
          and(
            eq(printLog.documentKind, documentKind),
            eq(printLog.documentId, documentId),
            isNull(printLog.deletedAt),
          ),
        )
        .limit(1)
        .get();
      return Boolean(prior);
    },
  };
}

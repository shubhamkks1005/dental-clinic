import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billItems, bills } from "../schema";

export type BillItemRow = {
  id: string;
  procedureLabel: string;
  toothFdi: number | null;
  qty: number;
  unitPaise: number;
  discountPaise: number;
  taxCategory: string;
  taxRateBp: number;
  taxPaise: number;
  lineTotalPaise: number;
  listItemId: string | null;
  planItemId: string | null;
  visitProcedureId: string | null;
  feeChangeReason: string | null;
  sortOrder: number;
};

export type BillRow = {
  id: string;
  patientId: string;
  visitId: string | null;
  billNo: string | null;
  billPeriod: string | null;
  billOn: string;
  status: string;
  kind: string;
  subtotalPaise: number;
  discountPaise: number;
  discountReason: string | null;
  discountApprovedBy: string | null;
  taxPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  notes: string;
  cancelReason: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  version: number;
  items: BillItemRow[];
};

const billCols = {
  id: bills.id,
  patientId: bills.patientId,
  visitId: bills.visitId,
  billNo: bills.billNo,
  billPeriod: bills.billPeriod,
  billOn: bills.billOn,
  status: bills.status,
  kind: bills.kind,
  subtotalPaise: bills.subtotalPaise,
  discountPaise: bills.discountPaise,
  discountReason: bills.discountReason,
  discountApprovedBy: bills.discountApprovedBy,
  taxPaise: bills.taxPaise,
  roundOffPaise: bills.roundOffPaise,
  totalPaise: bills.totalPaise,
  notes: bills.notes,
  cancelReason: bills.cancelReason,
  issuedAt: bills.issuedAt,
  issuedBy: bills.issuedBy,
  version: bills.version,
};

export function billsGetRepo(db: Db, ctx: Ctx) {
  return {
    async get(id: string): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select(billCols)
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      const items = await db
        .select({
          id: billItems.id,
          procedureLabel: billItems.procedureLabel,
          toothFdi: billItems.toothFdi,
          qty: billItems.qty,
          unitPaise: billItems.unitPaise,
          discountPaise: billItems.discountPaise,
          taxCategory: billItems.taxCategory,
          taxRateBp: billItems.taxRateBp,
          taxPaise: billItems.taxPaise,
          lineTotalPaise: billItems.lineTotalPaise,
          listItemId: billItems.listItemId,
          planItemId: billItems.planItemId,
          visitProcedureId: billItems.visitProcedureId,
          feeChangeReason: billItems.feeChangeReason,
          sortOrder: billItems.sortOrder,
        })
        .from(billItems)
        .where(and(eq(billItems.billId, id), isNull(billItems.deletedAt)))
        .orderBy(asc(billItems.sortOrder))
        .all();
      return { ...row, items };
    },
  };
}

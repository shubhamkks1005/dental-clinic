import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { bills, patients } from "../schema";
import { paidByBill } from "./bills-paid";

export type BillSearchRow = {
  id: string;
  billNo: string | null;
  billOn: string;
  status: string;
  totalPaise: number;
  paidPaise: number;
  patientId: string;
  patientName: string;
  patientCode: string;
};

export type BillSearchInput = {
  q?: string;
  status?: "draft" | "issued" | "cancelled";
  limit: number;
  offset: number;
};

// Billing hub, Bills tab: newest first, search by bill number, patient name or patient code.
// Money figures only (no clinical data), so the same permission as taking a payment.
export function billsSearchRepo(db: Db, ctx: Ctx) {
  return {
    async searchBills(
      input: BillSearchInput,
    ): Promise<{ rows: BillSearchRow[]; hasMore: boolean }> {
      assertAllowed(ctx, "bills.create");
      const q = input.q?.trim();
      const text = q ? `%${q.replace(/[%_]/g, "")}%` : null;
      const rows = await db
        .select({
          id: bills.id,
          billNo: bills.billNo,
          billOn: bills.billOn,
          status: bills.status,
          totalPaise: bills.totalPaise,
          patientId: bills.patientId,
          patientName: patients.fullName,
          patientCode: patients.code,
        })
        .from(bills)
        .innerJoin(patients, eq(patients.id, bills.patientId))
        .where(
          and(
            isNull(bills.deletedAt),
            input.status ? eq(bills.status, input.status) : undefined,
            text
              ? or(
                  like(bills.billNo, text),
                  like(patients.fullName, text),
                  like(patients.code, text),
                )
              : undefined,
          ),
        )
        .orderBy(desc(bills.billOn), desc(sql`${bills.createdAt}`))
        .limit(input.limit + 1)
        .offset(input.offset)
        .all();
      const page = rows.slice(0, input.limit);
      const paid = await paidByBill(
        db,
        page.map((r) => r.id),
      );
      return {
        rows: page.map((r) => ({ ...r, paidPaise: paid.get(r.id) ?? 0 })),
        hasMore: rows.length > input.limit,
      };
    },
  };
}

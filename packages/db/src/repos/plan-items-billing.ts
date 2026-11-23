import { paidByBill } from "./bills-paid";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { billItems, bills } from "../schema";

export type PlanBillingTotals = {
  billedPaise: number;
  paidPaise: number;
};

/** Sum issued bill lines linked to plan items; paid = pro-rated allocations. */
export async function billingTotalsForPlanItems(
  db: Db,
  planItemIds: string[],
): Promise<Map<string, PlanBillingTotals>> {
  const result = new Map<string, PlanBillingTotals>();
  for (const id of planItemIds) result.set(id, { billedPaise: 0, paidPaise: 0 });
  if (planItemIds.length === 0) return result;

  const lines = await db
    .select({
      planItemId: billItems.planItemId,
      lineTotalPaise: billItems.lineTotalPaise,
      billId: billItems.billId,
      billTotalPaise: bills.totalPaise,
    })
    .from(billItems)
    .innerJoin(bills, eq(bills.id, billItems.billId))
    .where(
      and(
        inArray(billItems.planItemId, planItemIds),
        eq(bills.status, "issued"),
        isNull(billItems.deletedAt),
        isNull(bills.deletedAt),
      ),
    )
    .all();

  const billIds = [...new Set(lines.map((l) => l.billId))];
  const paidMap = await paidByBill(db, billIds);

  for (const line of lines) {
    if (!line.planItemId) continue;
    const cur = result.get(line.planItemId) ?? { billedPaise: 0, paidPaise: 0 };
    cur.billedPaise += line.lineTotalPaise;
    const billPaid = paidMap.get(line.billId) ?? 0;
    if (line.billTotalPaise > 0 && billPaid > 0) {
      cur.paidPaise += Math.floor((billPaid * line.lineTotalPaise) / line.billTotalPaise);
    }
    result.set(line.planItemId, cur);
  }
  return result;
}

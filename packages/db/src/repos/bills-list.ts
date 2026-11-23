import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills, patients } from "../schema";
import { openBillDues } from "./bills-dues";
import { patientAdvancePaise } from "./payments-advance";

export type PatientBillListRow = {
  id: string;
  billNo: string | null;
  billOn: string;
  status: string;
  kind: string;
  totalPaise: number;
  duePaise: number;
};

export function billsListRepo(db: Db, ctx: Ctx) {
  return {
    async listForPatient(patientId: string): Promise<{
      bills: PatientBillListRow[];
      outstandingDuePaise: number;
      advancePaise: number;
    }> {
      assertAllowed(ctx, "bills.create");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const rows = await db
        .select({
          id: bills.id,
          billNo: bills.billNo,
          billOn: bills.billOn,
          status: bills.status,
          kind: bills.kind,
          totalPaise: bills.totalPaise,
        })
        .from(bills)
        .where(and(eq(bills.patientId, patientId), isNull(bills.deletedAt)))
        .orderBy(desc(bills.billOn), desc(bills.createdAt))
        .all();

      const dues = await openBillDues(db, patientId);
      const dueMap = new Map(dues.map((d) => [d.billId, d.duePaise]));
      const outstandingDuePaise = dues.reduce((s, d) => s + d.duePaise, 0);

      const advancePaise = await patientAdvancePaise(db, patientId);

      return {
        bills: rows.map((r) => ({
          ...r,
          duePaise: r.status === "issued" ? (dueMap.get(r.id) ?? 0) : 0,
        })),
        outstandingDuePaise,
        advancePaise,
      };
    },
  };
}

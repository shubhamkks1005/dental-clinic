import { istDate, type CreateBillInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { visitProcedures, visits } from "../schema";
import { billsCreateRepo } from "./bills-create";
import type { BillRow } from "./bills-get";

/** 5.3.1: draft bill from visit procedures (fees from default_paise). */
export function billsFromVisitRepo(db: Db, ctx: Ctx) {
  const createRepo = billsCreateRepo(db, ctx);

  return {
    async createFromVisit(visitId: string): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const visit = await db
        .select({
          id: visits.id,
          patientId: visits.patientId,
          status: visits.status,
        })
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      if (visit.status === "void") {
        throw new InvalidError("Cannot bill a void visit.");
      }

      const procs = await db
        .select({
          id: visitProcedures.id,
          label: visitProcedures.label,
          toothFdi: visitProcedures.toothFdi,
          defaultPaise: visitProcedures.defaultPaise,
          listItemId: visitProcedures.listItemId,
        })
        .from(visitProcedures)
        .where(and(eq(visitProcedures.visitId, visitId), isNull(visitProcedures.deletedAt)))
        .all();

      if (procs.length === 0) {
        throw new InvalidError("Add procedures on the visit before creating a bill.");
      }

      const input: CreateBillInput = {
        patientId: visit.patientId,
        visitId: visit.id,
        billOn: istDate(new Date()),
        items: procs.map((p) => ({
          procedureLabel: p.label,
          toothFdi: p.toothFdi,
          qty: 1,
          unitPaise: p.defaultPaise ?? 0,
          listItemId: p.listItemId,
          visitProcedureId: p.id,
        })),
      };

      return createRepo.create(input);
    },
  };
}

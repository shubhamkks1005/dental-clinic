import { istDate, type CreateBillInput } from "@clinic/shared";
import { and, eq, isNull, ne } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { bills, settings, visitProcedures, visits } from "../schema";
import { billsCreateRepo } from "./bills-create";
import { billsGetRepo, type BillRow } from "./bills-get";

export type CreateFromVisitOptions = {
  /** Add a Consultation line (visit finished page). */
  consultation?: boolean;
  /** The amount typed by the doctor; when left out the usual fee setting is used. */
  consultationPaise?: number | null;
};

export const CONSULTATION_LABEL = "Consultation";
const NOTHING_TO_BILL =
  "There is nothing to bill on this visit. Add a procedure or a consultation fee.";

async function usualConsultationPaise(db: Db): Promise<number> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "billing.consultation_fee_paise"), isNull(settings.deletedAt)))
    .get();
  if (!row) return 0;
  try {
    const v: unknown = JSON.parse(row.valueJson);
    return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

/** 5.3.1: draft bill from visit procedures (fees from default_paise), plus an optional Consultation line. */
export function billsFromVisitRepo(db: Db, ctx: Ctx) {
  const createRepo = billsCreateRepo(db, ctx);
  const getRepo = billsGetRepo(db, ctx);

  async function liveBillOf(visitId: string): Promise<BillRow | null> {
    const row = await db
      .select({ id: bills.id })
      .from(bills)
      .where(
        and(eq(bills.visitId, visitId), ne(bills.status, "cancelled"), isNull(bills.deletedAt)),
      )
      .get();
    return row ? getRepo.get(row.id) : null;
  }

  /**
   * One live bill per visit: when the visit already has one (a second tap on "Pass to reception")
   * that bill comes back with created: false. The unique index (0063) settles two calls at once.
   */
  async function createFromVisitOnce(
    visitId: string,
    opts: CreateFromVisitOptions = {},
  ): Promise<{ bill: BillRow; created: boolean }> {
    assertAllowed(ctx, "bills.create");
    const visit = await db
      .select({ id: visits.id, patientId: visits.patientId, status: visits.status })
      .from(visits)
      .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
      .get();
    if (!visit) throw new NotFoundError("That visit");
    if (visit.status === "void") throw new InvalidError("Cannot bill a void visit.");

    const existing = await liveBillOf(visitId);
    if (existing) return { bill: existing, created: false };

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

    const items: CreateBillInput["items"] = procs.map((p) => ({
      procedureLabel: p.label,
      toothFdi: p.toothFdi,
      qty: 1,
      unitPaise: p.defaultPaise ?? 0,
      listItemId: p.listItemId,
      visitProcedureId: p.id,
    }));
    if (opts.consultation) {
      const fee = opts.consultationPaise ?? (await usualConsultationPaise(db));
      if (!fee || fee <= 0) throw new InvalidError("Enter the consultation fee.");
      items.push({ procedureLabel: CONSULTATION_LABEL, qty: 1, unitPaise: fee });
    }
    if (items.length === 0) throw new InvalidError(NOTHING_TO_BILL);

    try {
      const bill = await createRepo.create({
        patientId: visit.patientId,
        visitId: visit.id,
        billOn: istDate(new Date()),
        items,
      });
      return { bill, created: true };
    } catch (e) {
      // Two taps at once: the other one won. Hand back its bill instead of a second one.
      if (e instanceof InvalidError && e.message.startsWith("This visit already has a bill")) {
        const won = await liveBillOf(visitId);
        if (won) return { bill: won, created: false };
      }
      throw e;
    }
  }

  return {
    createFromVisitOnce,
    async createFromVisit(visitId: string, opts: CreateFromVisitOptions = {}): Promise<BillRow> {
      return (await createFromVisitOnce(visitId, opts)).bill;
    },
  };
}

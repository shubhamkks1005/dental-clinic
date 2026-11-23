import type { Repos } from "@clinic/db";
import {
  closeDay,
  createBill,
  dayCloseSummary,
  issueBill,
  recordPayment,
  recordRefund,
} from "../domain/bills";
import { createPrescription, issuePrescription } from "../domain/prescriptions";
import { must, type Flow, type Obj, type SeedReport } from "./staging-seed-core";

export async function prescribe(doc: Repos, f: Flow, visitId: string, report: SeedReport) {
  const made = must(
    await createPrescription(doc, {
      patientId: f.patientId,
      visitId,
      advice: "Fake advice (seed)",
      items: [
        {
          genericName: "Fake medicine A",
          form: "Tab",
          dose: "1",
          frequency: "1-0-1",
          days: "3 days",
          timing: "after_food",
        },
      ],
    }),
    "prescription",
  );
  const rx = (made as Obj).prescription;
  must(await issuePrescription(doc, rx.id, { version: rx.version }), "issue rx");
  report.prescriptions++;
}

export async function billAndPay(
  doc: Repos,
  rec: Repos,
  f: Flow,
  visitId: string,
  report: SeedReport,
  wantRefund: boolean,
) {
  const total = (500 + (f.k % 5) * 500) * 100;
  const made = must(
    await createBill(rec, {
      patientId: f.patientId,
      visitId,
      billOn: f.day,
      items: [{ procedureLabel: "Fake procedure (seed)", qty: 1, unitPaise: total }],
    }),
    "bill",
  );
  const bill = (made as Obj).bill;
  must(await issueBill(rec, bill.id, { version: bill.version }), "issue bill");
  report.bills++;
  const scenario = f.k % 4;
  const pay = async (amountPaise: number, extra: Obj = {}) => {
    const r = must(
      await recordPayment(rec, {
        patientId: f.patientId,
        amountPaise,
        mode: "cash",
        dayLocal: f.day,
        allocations: [{ billId: bill.id, amountPaise }],
        ...extra,
      }),
      "payment",
    );
    report.payments++;
    return (r as Obj).payment as Obj;
  };
  if (scenario === 0) {
    const p = await pay(total);
    if (wantRefund) {
      must(
        await recordRefund(doc, {
          paymentId: p.id,
          amountPaise: Math.floor(total / 10),
          mode: "cash",
          reason: "Fake refund (seed)",
        }),
        "refund",
      );
      report.refunds++;
      return true;
    }
  } else if (scenario === 1) {
    await pay(total, { mode: "cash", splitMode: "upi", splitPaise: Math.floor(total / 2) });
  } else if (scenario === 2) {
    await pay(Math.floor(total / 2)); // leaves a due
  } // scenario 3: nothing paid, full due
  return false;
}

export async function closeSeedDay(rec: Repos, day: string, report: SeedReport) {
  try {
    const s = (await dayCloseSummary(rec, day)) as Obj;
    const cash = (s.summary ?? s).cashExpectedPaise ?? 0;
    must(
      await closeDay(rec, { dayLocal: day, cashCountedPaise: cash, note: "Seed day close (fake)" }),
      "close day",
    );
    report.closedDay = day;
  } catch (e) {
    report.skipped.push(`close ${day}: ${e instanceof Error ? e.message : "failed"}`);
  }
}

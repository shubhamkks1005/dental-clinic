import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTPAYTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009902', 'Fake Pay Patient', 'female', 30, '+919900001902', 'active')`,
    )
    .run(PATIENT_ID);
});

async function issuedBill(totalPaise: number, label: string) {
  const draft = await repos(receptionist).bills.create({
    patientId: PATIENT_ID,
    billOn: "2026-11-23",
    items: [{ procedureLabel: label, qty: 1, unitPaise: totalPaise }],
  });
  return repos(receptionist).bills.issue(draft.id, draft.version);
}

describe("payments allocation (5.2.2)", () => {
  it("splits one payment across bills and never over-allocates", async () => {
    const a = await issuedBill(100_00, "A");
    const b = await issuedBill(80_00, "B");
    const pay = await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 150_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });
    expect(pay.allocations).toEqual([
      { billId: a.id, amountPaise: 100_00 },
      { billId: b.id, amountPaise: 50_00 },
    ]);
    expect(pay.advancePaise).toBe(0);
    expect(pay.receiptNo).toMatch(/^S?R-\d{4}-\d{6}$/);

    await expect(
      repos(receptionist).payments.record({
        patientId: PATIENT_ID,
        amountPaise: 10_00,
        mode: "upi",
        dayLocal: "2026-11-23",
        allocations: [{ billId: a.id, amountPaise: 10_00 }],
      }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("leaves unallocated amount as patient advance (5.2.4)", async () => {
    await issuedBill(100_00, "Only");
    const pay = await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 150_00,
      mode: "upi",
      dayLocal: "2026-11-23",
    });
    expect(pay.advancePaise).toBe(50_00);
  });

  it("records cash + UPI split on one payment (5.3.2)", async () => {
    await issuedBill(150_000, "Split bill");
    const pay = await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 150_000,
      mode: "cash",
      splitMode: "upi",
      splitPaise: 50_000,
      reference: "fake-ref",
      dayLocal: "2026-11-23",
    });
    expect(pay.mode).toBe("cash");
    expect(pay.splitMode).toBe("upi");
    expect(pay.splitPaise).toBe(50_000);
    expect(pay.amountPaise).toBe(150_000);
  });
});

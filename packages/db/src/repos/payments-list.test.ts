import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = receptionist) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTPAYLIST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009905', 'Fake Pay List', 'female', 30, '+919900001905', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("payments list + refund path (5.3.7)", () => {
  it("lists refundable remainder and records a doctor refund", async () => {
    const draft = await repos().bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: 100_00 }],
    });
    await repos().bills.issue(draft.id, draft.version);
    const pay = await repos().payments.record({
      patientId: PATIENT_ID,
      amountPaise: 100_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });

    const list = await repos().payments.listForPatient(PATIENT_ID);
    expect(list).toHaveLength(1);
    expect(list[0]!.refundablePaise).toBe(100_00);
    // Q1.3: the row says which bill it paid.
    const issued = await repos().bills.listForPatient(PATIENT_ID);
    expect(list[0]!.appliedTo).toEqual([issued.bills[0]!.billNo]);

    const refund = await repos(doctor).refunds.record({
      paymentId: pay.id,
      amountPaise: 40_00,
      mode: "cash",
      reason: "Fake overcharge correction",
    });
    expect(refund.refundNo).toMatch(/^S?F-\d{4}-\d{6}$/);

    const after = await repos().payments.listForPatient(PATIENT_ID);
    expect(after[0]!.refundablePaise).toBe(60_00);
  });
});

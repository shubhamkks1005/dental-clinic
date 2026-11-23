import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

// Q0.7 / decision D1: a refund re-opens the due amount.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);
const PATIENT_ID = "01M85PATIENTPAIDTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Paid Patient', 'female', 30, '+919900001904', 'active')`,
    )
    .run(PATIENT_ID);
});

async function issuedBill(totalPaise: number) {
  const draft = await repos().bills.create({
    patientId: PATIENT_ID,
    billOn: "2026-11-23",
    items: [{ procedureLabel: "X", qty: 1, unitPaise: totalPaise }],
  });
  return repos().bills.issue(draft.id, draft.version);
}

const pay = (amountPaise: number, allowAdvance = false) =>
  repos().payments.record({
    patientId: PATIENT_ID,
    amountPaise,
    mode: "cash",
    dayLocal: "2026-11-23",
    allowAdvance,
  });
const refund = (paymentId: string, amountPaise: number) =>
  repos().refunds.record({ paymentId, amountPaise, mode: "cash", reason: "Test" });
const account = () => repos().bills.listForPatient(PATIENT_ID);

describe("refund re-opens the due (D1)", () => {
  it("pay 500, refund 500: outstanding returns to the original", async () => {
    const bill = await issuedBill(500_00);
    const p = await pay(500_00);
    expect((await account()).outstandingDuePaise).toBe(0);
    await refund(p.id, 500_00);
    const a = await account();
    expect(a.outstandingDuePaise).toBe(500_00);
    expect(a.bills.find((b) => b.id === bill.id)?.duePaise).toBe(500_00);
    expect(a.advancePaise).toBe(0);
  });

  it("a part refund re-opens only that part", async () => {
    await issuedBill(500_00);
    const p = await pay(500_00);
    await refund(p.id, 200_00);
    expect((await account()).outstandingDuePaise).toBe(200_00);
  });

  it("a refund takes the unapplied advance first, then the bill payment", async () => {
    await issuedBill(200_00);
    const p = await pay(500_00, true); // 200 applied, 300 advance
    expect((await account()).advancePaise).toBe(300_00);
    await refund(p.id, 200_00); // all from the advance
    let a = await account();
    expect(a.advancePaise).toBe(100_00);
    expect(a.outstandingDuePaise).toBe(0);
    await refund(p.id, 200_00); // 100 advance left, 100 comes off the bill payment
    a = await account();
    expect(a.advancePaise).toBe(0);
    expect(a.outstandingDuePaise).toBe(100_00);
  });

  it("a fully refunded bill can be cancelled; a part refunded one cannot", async () => {
    const bill = await issuedBill(500_00);
    const p = await pay(500_00);
    await refund(p.id, 100_00);
    await expect(repos().bills.cancel(bill.id, bill.version, "Wrong")).rejects.toBeInstanceOf(
      InvalidError,
    );
    await refund(p.id, 400_00);
    const cancelled = await repos().bills.cancel(bill.id, bill.version, "Wrong procedure");
    expect(cancelled.status).toBe("cancelled");
  });
});

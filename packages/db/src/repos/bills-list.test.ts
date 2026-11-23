import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTSTMTTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009903', 'Fake Statement Patient', 'male', 35, '+919900001903', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("patient account list (5.3.3)", () => {
  it("keeps outstanding equal to sum of open dues across 20 entries", async () => {
    const billIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const draft = await repos(receptionist).bills.create({
        patientId: PATIENT_ID,
        billOn: `2026-11-${String(i + 1).padStart(2, "0")}`,
        items: [{ procedureLabel: `Item ${i}`, qty: 1, unitPaise: 10_000 }],
      });
      const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
      billIds.push(issued.id);
    }
    // Pay half of each of the first 5 bills (5_000 of 10_000).
    for (let i = 0; i < 5; i++) {
      await repos(receptionist).payments.record({
        patientId: PATIENT_ID,
        amountPaise: 5_000,
        mode: "cash",
        dayLocal: "2026-11-23",
        allocations: [{ billId: billIds[i]!, amountPaise: 5_000 }],
      });
    }
    // 5 more payment rows (advances) so ledger has 20 money rows (10 bills + 10 payments).
    for (let i = 0; i < 5; i++) {
      await repos(receptionist).payments.record({
        patientId: PATIENT_ID,
        amountPaise: 1_000,
        mode: "upi",
        dayLocal: "2026-11-23",
      });
    }

    const account = await repos(receptionist).bills.listForPatient(PATIENT_ID);
    const dueSum = account.bills.reduce((s, b) => s + b.duePaise, 0);
    expect(account.outstandingDuePaise).toBe(dueSum);
    // 5 bills fully open (10k) + 5 half-paid (5k) = 75_000; advances do not reduce dues here
    // because they were not allocated — wait, record without allocations auto-allocates.
    // After 5 partials, remaining due = 5*5000 + 5*10000 = 75_000, then 5*1000 advances
    // auto-allocate to oldest dues → reduce by 5000 → 70_000.
    expect(account.outstandingDuePaise).toBe(70_000);
    expect(account.bills).toHaveLength(10);
  });
});

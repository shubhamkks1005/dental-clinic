import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTCONCURR0001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009906', 'Fake Concurrent Patient', 'female', 29, '+919900001906', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("billing safety CI (5.5.1)", () => {
  it("50 parallel bill issues get unique gap-free numbers", async () => {
    const drafts = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        repos(receptionist).bills.create({
          patientId: PATIENT_ID,
          billOn: "2026-11-23",
          items: [{ procedureLabel: `Item ${i}`, qty: 1, unitPaise: 1000 }],
        }),
      ),
    );
    const issued = await Promise.all(
      drafts.map((d) => repos(receptionist).bills.issue(d.id, d.version)),
    );
    const nos = issued.map((b) => b.billNo!).sort();
    expect(new Set(nos).size).toBe(50);
    const nums = nos.map((n) => Number(n.split("-").pop()));
    expect(nums.sort((a, b) => a - b)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  it("refund cannot exceed payment (repo rule)", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "X", qty: 1, unitPaise: 10_000 }],
    });
    const bill = await repos(receptionist).bills.issue(draft.id, draft.version);
    const pay = await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 10_000,
      mode: "cash",
      dayLocal: "2026-11-23",
      allocations: [{ billId: bill.id, amountPaise: 10_000 }],
    });
    await expect(
      repos(doctor).refunds.record({
        paymentId: pay.id,
        amountPaise: 10_001,
        mode: "cash",
        reason: "Too much",
      }),
    ).rejects.toBeInstanceOf(InvalidError);
  });
});

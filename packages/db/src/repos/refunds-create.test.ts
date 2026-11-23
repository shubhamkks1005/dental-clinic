import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTREFTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009903', 'Fake Refund Patient', 'female', 30, '+919900001903', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("refunds (5.2.3)", () => {
  it("blocks refund over payment and blocks receptionist", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "X", qty: 1, unitPaise: 100_00 }],
    });
    await repos(receptionist).bills.issue(draft.id, draft.version);
    const pay = await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 100_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });

    await expect(
      repos(receptionist).refunds.record({
        paymentId: pay.id,
        amountPaise: 10_00,
        mode: "cash",
        reason: "Mistake",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      repos(doctor).refunds.record({
        paymentId: pay.id,
        amountPaise: 150_00,
        mode: "cash",
        reason: "Too much",
      }),
    ).rejects.toBeInstanceOf(InvalidError);

    const ok = await repos(doctor).refunds.record({
      paymentId: pay.id,
      amountPaise: 40_00,
      mode: "upi",
      reason: "Partial reverse",
    });
    expect(ok.amountPaise).toBe(40_00);
    expect(ok.mode).toBe("upi");
    expect(ok.refundNo).toMatch(/^S?F-\d{4}-\d{6}$/);
  });
});

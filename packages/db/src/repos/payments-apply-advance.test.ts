import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = receptionist) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTADVTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009903', 'Fake Advance Patient', 'female', 30, '+919900001903', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("apply advance to bill (5.3.5)", () => {
  it("uses credit so half the bill is covered and remaining due is correct", async () => {
    // Overpay an old bill → 50_00 advance.
    const old = await repos().bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-01",
      items: [{ procedureLabel: "Fake old", qty: 1, unitPaise: 100_00 }],
    });
    await repos().bills.issue(old.id, old.version);
    await repos().payments.record({
      patientId: PATIENT_ID,
      amountPaise: 150_00,
      mode: "upi",
      dayLocal: "2026-11-01",
    });

    const draft = await repos().bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake new", qty: 1, unitPaise: 100_00 }],
    });
    await repos().bills.issue(draft.id, draft.version, { applyAdvance: true });

    const account = await repos().bills.listForPatient(PATIENT_ID);
    expect(account.advancePaise).toBe(0);
    const newRow = account.bills.find((b) => b.id === draft.id)!;
    expect(newRow.duePaise).toBe(50_00);
    expect(account.outstandingDuePaise).toBe(50_00);
  });
});

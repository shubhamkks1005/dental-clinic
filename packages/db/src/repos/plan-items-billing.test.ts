import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTPLANBILL001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009905', 'Fake Plan Bill Patient', 'male', 33, '+919900001905', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("plan item billed vs estimate (5.3.15)", () => {
  it("shows billed above estimate and paid from allocations", async () => {
    const plan = await repos().planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "Crown",
      estimatePaise: 100_000,
      phase: 1,
      sittings: 1,
    });

    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [
        {
          procedureLabel: "Crown",
          qty: 1,
          unitPaise: 150_000,
          planItemId: plan.id,
        },
      ],
    });
    const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
    await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 60_000,
      mode: "upi",
      dayLocal: "2026-11-23",
      allocations: [{ billId: issued.id, amountPaise: 60_000 }],
    });

    const listed = await repos().planItems.listForPatient(PATIENT_ID);
    const row = listed.find((i) => i.id === plan.id);
    expect(row?.estimatePaise).toBe(100_000);
    expect(row?.billedPaise).toBe(150_000);
    expect(row?.paidPaise).toBe(60_000);
    expect((row?.billedPaise ?? 0) > (row?.estimatePaise ?? 0)).toBe(true);
  });
});

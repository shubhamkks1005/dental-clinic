import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, receptionist);
const PATIENT_ID = "01M85PATIENTPRINTBILL1";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009907', 'Fake Print Bill', 'female', 30, '+919900001907', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bill/receipt print log (5.3.11)", () => {
  it("marks second bill print as Duplicate copy", async () => {
    const draft = await repos().bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake print item", qty: 1, unitPaise: 100_00 }],
    });
    const bill = await repos().bills.issue(draft.id, draft.version);
    const first = await repos().printLog.record({
      documentKind: "bill",
      documentId: bill.id,
      documentVersion: bill.version,
    });
    expect(first.isReprint).toBe(false);
    const second = await repos().printLog.record({
      documentKind: "bill",
      documentId: bill.id,
      documentVersion: bill.version,
    });
    expect(second.isReprint).toBe(true);

    const pay = await repos().payments.record({
      patientId: PATIENT_ID,
      amountPaise: 100_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });
    const r1 = await repos().printLog.record({ documentKind: "receipt", documentId: pay.id });
    const r2 = await repos().printLog.record({ documentKind: "receipt", documentId: pay.id });
    expect(r1.isReprint).toBe(false);
    expect(r2.isReprint).toBe(true);

    const withPays = await repos().bills.get(bill.id);
    expect(withPays.payments.length).toBe(1);
  });
});

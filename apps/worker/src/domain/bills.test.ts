import { createRepos } from "@clinic/db";
import { testDb } from "@clinic/db/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { createBillFromVisit } from "./bills";

// D5: a bill from a finalised visit is issued straight away; "Review first" keeps a draft.
const ctx = { userId: "rec-1", role: "receptionist" as const, requestId: "r1" };
const doctor = { userId: "doc-a", role: "doctor" as const, requestId: "r2" };
let t: ReturnType<typeof testDb>;
const PATIENT = "01M85PATIENTDOMBILL00001";

async function visitWithProcedure(label: string, paise: number) {
  const listed = await createRepos(t.db, doctor).lists.add("procedures", {
    label,
    data: { default_paise: paise, code: label.slice(0, 6).toUpperCase() },
  });
  const item = listed.find((i) => i.label === label)!;
  const visit = await createRepos(t.db, doctor).visits.open({
    patientId: PATIENT,
    visitDateLocal: "2026-11-23",
  });
  await createRepos(t.db, doctor).visitProcedures.add({ visitId: visit.id, listItemId: item.id });
  return visit.id;
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009911', 'Fake Domain Bill Patient', 'female', 30, '+919900001911', 'active')`,
    )
    .run(PATIENT);
});

describe("createBillFromVisit (D5)", () => {
  it("issues at once with a number, and the next bill gets the next number", async () => {
    const first = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale one", 50_000),
    );
    expect(first.bill.status).toBe("issued");
    expect(first.bill.billNo).toMatch(/^SB-/);
    const second = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale two", 70_000),
    );
    const n = (no: string | null) => Number(no!.split("-").pop());
    expect(n(second.bill.billNo)).toBe(n(first.bill.billNo) + 1);
  });

  it("Review first keeps a draft with no number", async () => {
    const r = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale three", 40_000),
      { reviewFirst: true },
    );
    expect(r.bill.status).toBe("draft");
    expect(r.bill.billNo).toBeNull();
  });

  it("writes an audit row for the issue", async () => {
    await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale four", 10_000),
    );
    const rows = t.sqlite
      .prepare("SELECT after_json FROM audit_log WHERE table_name = 'bills' AND action = 'update'")
      .all() as { after_json: string }[];
    expect(rows.some((r) => r.after_json.includes('"issued"'))).toBe(true);
  });
});

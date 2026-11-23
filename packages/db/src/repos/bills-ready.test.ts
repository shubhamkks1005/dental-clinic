import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const P = "01M85PATIENTREADYTEST01";

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = receptionist) => createRepos(t.db, ctx);

function addVisit(id: string, apptId: string, status: string) {
  t.sqlite
    .prepare(
      `INSERT INTO visits (id, created_by, updated_by, patient_id, appointment_id, doctor_id, visit_date_local, status)
       VALUES (?, 'system', 'system', ?, ?, 'doc-a', '2026-11-23', ?)`,
    )
    .run(id, P, apptId, status);
}

async function billFor(visitId: string, issue: boolean, amount = 500_00) {
  const draft = await repos().bills.create({
    patientId: P,
    billOn: "2026-11-23",
    items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: amount }],
  });
  t.sqlite.prepare("UPDATE bills SET visit_id = ? WHERE id = ?").run(visitId, draft.id);
  if (issue) await repos().bills.issue(draft.id, draft.version);
  return draft.id;
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009901', 'Fake Ready One', 'female', 30, '+919900009901', 'active')`,
    )
    .run(P);
});

describe("ready to bill (Q1.2)", () => {
  it("is ready when the visit is final and there is no bill", async () => {
    addVisit("v1", "a1", "final");
    const map = await repos().bills.readyToBill(["a1"]);
    expect(map.get("a1")).toEqual({ visitId: "v1", billId: null });
  });

  it("is not ready while the visit is still a draft", async () => {
    addVisit("v1", "a1", "draft");
    expect((await repos().bills.readyToBill(["a1"])).size).toBe(0);
  });

  it("is ready with an unpaid bill and drops out when it is paid in full", async () => {
    addVisit("v1", "a1", "final");
    const billId = await billFor("v1", true);
    expect((await repos().bills.readyToBill(["a1"])).get("a1")).toEqual({
      visitId: "v1",
      billId,
    });
    await repos().payments.record({
      patientId: P,
      amountPaise: 500_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });
    expect((await repos().bills.readyToBill(["a1"])).size).toBe(0);
  });
});

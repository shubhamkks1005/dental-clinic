import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTBILLUPD0001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009902', 'Fake Draft Edit Patient', 'female', 28, '+919900001902', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bills updateDraft (5.3.1)", () => {
  it("requires a reason when fee differs from visit procedure list fee", async () => {
    const listed = await repos().lists.add("procedures", {
      label: "Scaling fee-change test",
      data: { default_paise: 150000, code: "SCL_FC" },
    });
    const listItem = listed.find((i) => i.label === "Scaling fee-change test");
    expect(listItem).toBeDefined();

    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-23",
    });
    await repos().visitProcedures.add({
      visitId: visit.id,
      listItemId: listItem!.id,
    });

    const bill = await repos(receptionist).bills.createFromVisit(visit.id);
    expect(bill.items[0]?.listUnitPaise).toBe(150_000);
    const visitProcedureId = bill.items[0]!.visitProcedureId!;

    await expect(
      repos(receptionist).bills.updateDraft(bill.id, {
        version: bill.version,
        items: [
          {
            procedureLabel: "Scaling fee-change test",
            qty: 1,
            unitPaise: 100_000,
            visitProcedureId,
            feeChangeReason: null,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidError);

    const updated = await repos(receptionist).bills.updateDraft(bill.id, {
      version: bill.version,
      items: [
        {
          procedureLabel: "Scaling fee-change test",
          qty: 1,
          unitPaise: 100_000,
          visitProcedureId,
          feeChangeReason: "Hard case",
        },
      ],
    });
    expect(updated.totalPaise).toBe(100_000);
    expect(updated.items[0]?.feeChangeReason).toBe("Hard case");
    expect(updated.items[0]?.listUnitPaise).toBe(150_000);

    // Visit finished Q1 (owner 2026-11-27): the doctor needs no reason; the audit keeps the amounts.
    const byDoctor = await repos().bills.updateDraft(bill.id, {
      version: updated.version,
      items: [
        {
          procedureLabel: "Scaling fee-change test",
          qty: 1,
          unitPaise: 120_000,
          visitProcedureId,
          feeChangeReason: null,
        },
      ],
    });
    expect(byDoctor.totalPaise).toBe(120_000);
    const audit = t.sqlite
      .prepare(
        `SELECT before_json, after_json FROM audit_log WHERE table_name = 'bills' AND row_id = ? AND action = 'update' ORDER BY rowid DESC LIMIT 1`,
      )
      .get(bill.id) as { before_json: string; after_json: string };
    expect(audit.before_json).toContain("100000");
    expect(audit.after_json).toContain("120000");
  });
});

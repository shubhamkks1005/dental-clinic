import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTBILLTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009901', 'Fake Bill Patient', 'female', 30, '+919900001901', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bills create (5.2.1)", () => {
  it("stores totals that always match the items", async () => {
    const bill = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [
        { procedureLabel: "Scaling", qty: 1, unitPaise: 150_000 },
        { procedureLabel: "Filling", qty: 2, unitPaise: 80_000, discountPaise: 1_000 },
      ],
    });
    expect(bill.status).toBe("draft");
    expect(bill.billNo).toBeNull();
    expect(bill.subtotalPaise).toBe(309_000);
    expect(bill.totalPaise).toBe(
      bill.subtotalPaise - bill.discountPaise + bill.taxPaise + bill.roundOffPaise,
    );
    const itemsSum = bill.items.reduce((s, i) => s + i.lineTotalPaise, 0);
    expect(itemsSum).toBe(bill.subtotalPaise - bill.discountPaise + bill.taxPaise);
    const audit = t.sqlite.prepare(`SELECT action, table_name FROM audit_log`).all();
    expect(audit).toContainEqual({ action: "create", table_name: "bills" });
  });
});

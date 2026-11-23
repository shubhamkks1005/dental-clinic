import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, receptionist);
const A = "01M85PATIENTSEARCH00001";
const B = "01M85PATIENTSEARCH00002";

async function issue(patientId: string, paise: number, payPaise = 0) {
  const draft = await repos().bills.create({
    patientId,
    billOn: "2026-11-20",
    items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: paise }],
  });
  const bill = await repos().bills.issue(draft.id, draft.version);
  if (payPaise > 0) {
    await repos().payments.record({
      patientId,
      amountPaise: payPaise,
      mode: "cash",
      dayLocal: "2026-11-20",
      allocations: [{ billId: bill.id, amountPaise: payPaise }],
    });
  }
  return bill;
}

beforeEach(() => {
  t = testDb();
  const ins = t.sqlite.prepare(
    `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
     VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
  );
  ins.run(A, "P-009921", "Fake Search Alpha", "+919900001921");
  ins.run(B, "P-009922", "Fake Search Beta", "+919900001922");
});

describe("searchBills (billing hub, Bills tab)", () => {
  it("lists newest first with the paid amount, and finds by name, code and bill number", async () => {
    const one = await issue(A, 100_000, 40_000);
    await issue(B, 50_000);
    const all = await repos().bills.searchBills({ limit: 25, offset: 0 });
    expect(all.rows).toHaveLength(2);
    expect(all.rows.find((r) => r.id === one.id)?.paidPaise).toBe(40_000);
    expect(
      (await repos().bills.searchBills({ q: "Alpha", limit: 25, offset: 0 })).rows,
    ).toHaveLength(1);
    expect(
      (await repos().bills.searchBills({ q: "P-009922", limit: 25, offset: 0 })).rows,
    ).toHaveLength(1);
    expect(
      (await repos().bills.searchBills({ q: one.billNo!, limit: 25, offset: 0 })).rows,
    ).toHaveLength(1);
  });

  it("pages and filters by status", async () => {
    await issue(A, 10_000);
    await issue(A, 20_000);
    const first = await repos().bills.searchBills({ limit: 1, offset: 0 });
    expect(first.hasMore).toBe(true);
    const draftOnly = await repos().bills.searchBills({ status: "draft", limit: 25, offset: 0 });
    expect(draftOnly.rows).toHaveLength(0);
  });

  it("is refused for a role without bill access", async () => {
    const dev: Ctx = { userId: "dev-1", role: "developer", requestId: "r9" };
    await expect(
      createRepos(t.db, dev).bills.searchBills({ limit: 25, offset: 0 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

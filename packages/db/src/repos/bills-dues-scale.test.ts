import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { paidByBill } from "./bills-paid";
import { createRepos } from "./index";

// S1.3.3: 150 issued bills (some paid, some part paid, some refunded). FakeD1 rejects >100 values.
const rec: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, rec);
const N = 150;
const pid = (i: number) => `01S13PATIENTSCALE${String(i).padStart(5, "0")}`;

// Expected due per bill i (patient i has exactly one bill of 1000.00):
//   i%5==0 fully paid, 1 part paid 400, 2 unpaid, 3 paid then refunded 300, 4 paid then fully refunded
const expectedDue = (i: number) => [0, 600_00, 1000_00, 300_00, 1000_00][i % 5]!;

beforeEach(async () => {
  t = testDb();
  for (let i = 0; i < N; i++) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
      )
      .run(pid(i), `P-${String(800000 + i)}`, `Fake Scale ${i}`, `+9199${String(70000000 + i)}`);
  }
  for (let i = 0; i < N; i++) {
    const draft = await repos().bills.create({
      patientId: pid(i),
      billOn: "2026-11-10",
      items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: 1000_00 }],
    });
    await repos().bills.issue(draft.id, draft.version);
    const k = i % 5;
    if (k === 2) continue;
    const pay = await repos().payments.record({
      patientId: pid(i),
      amountPaise: k === 1 ? 400_00 : 1000_00,
      mode: "cash",
      dayLocal: "2026-11-11",
    });
    if (k === 3 || k === 4) {
      await createRepos(t.db, doctor).refunds.record({
        paymentId: pay.id,
        amountPaise: k === 3 ? 300_00 : 1000_00,
        mode: "cash",
        reason: "Test",
      });
    }
  }
}, 120_000);

describe("dues with 150 issued bills", () => {
  it("listDues, duesForPatients and paidByBill agree and respect the 100-values guard", async () => {
    const list = await repos().bills.listDues(new Date("2026-11-23T12:00:00Z"));
    let total = 0;
    for (let i = 0; i < N; i++) total += expectedDue(i);
    expect(list.totalDuePaise).toBe(total);
    expect(list.rows).toHaveLength(N - N / 5);
    for (const i of [1, 2, 3, 4, 146, 147, 148, 149]) {
      expect(list.rows.find((r) => r.patientId === pid(i))?.duePaise).toBe(expectedDue(i));
    }
    expect(list.rows.some((r) => r.patientId === pid(0))).toBe(false);
    expect(list.byBucket["0-30"]).toBe(total);

    const ids = Array.from({ length: N }, (_, i) => pid(i));
    const dues = await repos().bills.duesForPatients(ids);
    expect(dues.size).toBe(N - N / 5);
    for (let i = 0; i < N; i++) expect(dues.get(pid(i)) ?? 0).toBe(expectedDue(i));

    const billIds = t.sqlite.prepare("SELECT id, patient_id FROM bills").all() as {
      id: string;
      patient_id: string;
    }[];
    const paid = await paidByBill(
      t.db,
      billIds.map((b) => b.id),
    );
    for (const b of billIds) {
      const i = ids.indexOf(b.patient_id);
      expect(1000_00 - (paid.get(b.id) ?? 0)).toBe(expectedDue(i));
    }
  });
});

describe("one payment over two bills, then a refund (newest allocation first)", () => {
  it("listDues matches paidByBill", async () => {
    const P = "01S13PATIENTSPLIT00001";
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', 'P-899999', 'Fake Split', 'female', 30, '+919970099999', 'active')`,
      )
      .run(P);
    for (const day of ["2026-11-01", "2026-11-02"]) {
      const d = await repos().bills.create({
        patientId: P,
        billOn: day,
        items: [{ procedureLabel: "Fake item", qty: 1, unitPaise: 1000_00 }],
      });
      await repos().bills.issue(d.id, d.version);
    }
    const pay = await repos().payments.record({
      patientId: P,
      amountPaise: 1500_00,
      mode: "cash",
      dayLocal: "2026-11-11",
    });
    await createRepos(t.db, doctor).refunds.record({
      paymentId: pay.id,
      amountPaise: 700_00,
      mode: "cash",
      reason: "Test",
    });
    const ids = (
      t.sqlite.prepare("SELECT id FROM bills WHERE patient_id = ?").all(P) as { id: string }[]
    ).map((b) => b.id);
    const paid = await paidByBill(t.db, ids);
    const due = ids.reduce((sum, id) => sum + 1000_00 - (paid.get(id) ?? 0), 0);
    expect(due).toBe(1000_00 + 1000_00 - 800_00);
    const list = await repos().bills.listDues(new Date("2026-11-23T12:00:00Z"));
    expect(list.rows.find((r) => r.patientId === P)?.duePaise).toBe(due);
  });
});

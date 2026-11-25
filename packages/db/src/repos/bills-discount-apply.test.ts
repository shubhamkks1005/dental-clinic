import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M86PATIENTDOCDISC0001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009991', 'Fake Discount Patient', 'male', 35, '+919900099911', 'active')`,
    )
    .run(PATIENT_ID);
});

const draft = (unitPaise = 100_000) =>
  repos(receptionist).bills.create({
    patientId: PATIENT_ID,
    billOn: "2026-11-25",
    items: [{ procedureLabel: "Filling", qty: 1, unitPaise }],
  });

const audits = () =>
  t.sqlite
    .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE table_name = 'bills' AND action = 'update'")
    .get() as { n: number };

describe("doctor gives a discount in one step (P3, P4, P5)", () => {
  it("P3: 10 percent on a draft, approved at once, total recalculated, two audit rows", async () => {
    const bill = await draft();
    const next = await repos().bills.applyDoctorDiscount(bill.id, {
      version: bill.version,
      discountPercent: 10,
      reason: "courtesy",
    });
    expect(next).toMatchObject({
      status: "draft",
      discountPaise: 10_000,
      discountApprovedBy: "doc-a",
      totalPaise: 90_000,
      version: bill.version + 1,
    });
    expect(audits().n).toBe(2);
    // The bill can be issued without any further approval.
    const issued = await repos().bills.issue(next.id, next.version);
    expect(issued).toMatchObject({ status: "issued", totalPaise: 90_000 });
  });

  it("an amount in paise works too; more than the subtotal and zero are refused", async () => {
    const bill = await draft(50_000);
    await expect(
      repos().bills.applyDoctorDiscount(bill.id, {
        version: bill.version,
        discountPaise: 50_001,
        reason: "other",
      }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().bills.applyDoctorDiscount(bill.id, {
        version: bill.version,
        discountPaise: 0,
        reason: "other",
      }),
    ).rejects.toBeInstanceOf(InvalidError);
    const ok = await repos().bills.applyDoctorDiscount(bill.id, {
      version: bill.version,
      discountPaise: 50_000,
      reason: "other",
    });
    expect(ok.totalPaise).toBe(0);
  });

  it("P4: after issue it is refused and the bill is unchanged", async () => {
    const bill = await draft();
    const issued = await repos().bills.issue(bill.id, bill.version);
    const before = audits().n;
    await expect(
      repos().bills.applyDoctorDiscount(bill.id, {
        version: issued.version,
        discountPercent: 10,
        reason: "courtesy",
      }),
    ).rejects.toBeInstanceOf(InvalidError);
    const after = await repos().bills.get(bill.id);
    expect(after).toMatchObject({ totalPaise: 100_000, discountPaise: 0, version: issued.version });
    expect(audits().n).toBe(before);
  });

  it("P5: a receptionist is refused; a stale version is a conflict and writes nothing", async () => {
    const bill = await draft();
    await expect(
      repos(receptionist).bills.applyDoctorDiscount(bill.id, {
        version: bill.version,
        discountPercent: 10,
        reason: "courtesy",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      repos().bills.applyDoctorDiscount(bill.id, {
        version: bill.version + 5,
        discountPercent: 10,
        reason: "courtesy",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(audits().n).toBe(0);
    expect((await repos().bills.get(bill.id)).discountPaise).toBe(0);
  });

  it("the desk path is unchanged: a receptionist request still waits for the doctor", async () => {
    const bill = await draft();
    const requested = await repos(receptionist).bills.requestDiscount(bill.id, {
      version: bill.version,
      discountPercent: 10,
      reason: "courtesy",
    });
    expect(requested).toMatchObject({ discountApprovedBy: null, totalPaise: 100_000 });
  });
});

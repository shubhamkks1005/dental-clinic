import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTDISCTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Discount Patient', 'female', 30, '+919900001904', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bill discount approval (5.3.6)", () => {
  it("blocks issue until doctor approves; receptionist cannot approve", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake cleaning", qty: 1, unitPaise: 200_00 }],
    });
    const withDisc = await repos(receptionist).bills.requestDiscount(draft.id, {
      version: draft.version,
      discountPaise: 50_00,
      reason: "hardship",
    });
    expect(withDisc.discountPaise).toBe(50_00);
    expect(withDisc.discountApprovedBy).toBeNull();
    expect(withDisc.totalPaise).toBe(150_00);

    await expect(
      repos(receptionist).bills.issue(withDisc.id, withDisc.version),
    ).rejects.toBeInstanceOf(InvalidError);

    await expect(
      repos(receptionist).bills.approveDiscount(withDisc.id, { version: withDisc.version }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const approved = await repos(doctor).bills.approveDiscount(withDisc.id, {
      version: withDisc.version,
    });
    expect(approved.discountApprovedBy).toBe("doc-a");

    const issued = await repos(receptionist).bills.issue(approved.id, approved.version);
    expect(issued.status).toBe("issued");
    expect(issued.totalPaise).toBe(150_00);
  });
});

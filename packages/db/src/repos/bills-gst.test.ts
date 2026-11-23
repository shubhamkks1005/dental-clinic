import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTGSTTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009905', 'Fake Gst Patient', 'female', 30, '+919900001905', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("gst_mode (5.2.6)", () => {
  it("adds tax on a test bill when gst_mode is on", async () => {
    const setting = await repos().settings.get("billing.gst_mode");
    await repos().settings.update("billing.gst_mode", "on", setting.version);

    const bill = await repos().bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      kind: "opening_balance",
      items: [
        {
          procedureLabel: "Opening balance (fake)",
          qty: 1,
          unitPaise: 100_000,
          taxCategory: "cosmetic",
        },
      ],
    });
    expect(bill.kind).toBe("opening_balance");
    expect(bill.taxPaise).toBe(18_000);
    expect(bill.totalPaise).toBe(118_000);
  });
});

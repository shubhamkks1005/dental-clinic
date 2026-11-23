import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTHISTBILL01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009907', 'Fake Hist Bill', 'female', 30, '+919900001907', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history bills (5.3.16)", () => {
  it("includes bills and payments for receptionist; summary shows dues", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Scaling", qty: 1, unitPaise: 100_00 }],
    });
    const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
    await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 40_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });

    const feed = await repos(receptionist).history.listFeed(PATIENT_ID);
    const types = feed.entries.map((e) => e.type);
    expect(types).toContain("bill");
    expect(types).toContain("payment");
    expect(feed.entries.find((e) => e.type === "bill")?.href).toContain(issued.id);

    const summary = await repos(receptionist).history.getSummary(PATIENT_ID);
    expect(summary.outstandingDuePaise).toBe(60_00);
  });
});

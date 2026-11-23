import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTEXPORTTEST1";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Export Patient', 'female', 40, '+919900001904', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bills exportMonth (5.3.12)", () => {
  it("returns patient code only and blocks receptionist", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-05",
      items: [{ procedureLabel: "Scaling", qty: 1, unitPaise: 150_000 }],
    });
    const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
    await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 150_000,
      mode: "cash",
      splitMode: "upi",
      splitPaise: 50_000,
      dayLocal: "2026-11-05",
      allocations: [{ billId: issued.id, amountPaise: 150_000 }],
    });

    await expect(repos(receptionist).bills.exportMonth("2026-11")).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    const rows = await repos(doctor).bills.exportMonth("2026-11");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.patientCode).toBe("P-009904");
    expect(JSON.stringify(rows)).not.toContain("Fake Export Patient");
    expect(rows[0]?.procedureGroup).toContain("Scaling");
    expect(rows[0]?.modes).toMatch(/cash:/);
    expect(rows[0]?.modes).toMatch(/upi:/);

    const access = t.sqlite
      .prepare(`SELECT action, resource FROM access_log WHERE action = 'export'`)
      .all();
    expect(access.length).toBeGreaterThanOrEqual(1);
  });
});

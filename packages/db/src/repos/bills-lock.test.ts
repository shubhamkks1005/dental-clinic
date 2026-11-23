import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTLOCKTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Lock Patient', 'female', 30, '+919900001904', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("issued bill lock (5.2.7 / 5.3.8)", () => {
  it("refuses edits and blocks cancel when payments exist", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Y", qty: 1, unitPaise: 200_00 }],
    });
    const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
    await expect(repos().bills.assertDraftEditable(issued.id)).rejects.toBeInstanceOf(InvalidError);

    await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 50_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });
    await expect(
      repos(doctor).bills.cancel(issued.id, issued.version, "Wrong amount"),
    ).rejects.toBeInstanceOf(InvalidError);

    // Cancel after full refund path is out of scope here; unpaid draft cancel works.
    const d2 = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Z", qty: 1, unitPaise: 10_00 }],
    });
    const cancelled = await repos(doctor).bills.cancel(d2.id, d2.version, "Entered by mistake");
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelReason).toBe("Entered by mistake");
  });
});

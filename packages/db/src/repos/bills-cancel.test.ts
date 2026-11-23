import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M85PATIENTCANCEL001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009906', 'Fake Cancel Patient', 'female', 30, '+919900001906', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("bill cancel (5.3.8)", () => {
  it("blocks paid bills and receptionist; keeps number when cancelled", async () => {
    const draft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake cancel item", qty: 1, unitPaise: 100_00 }],
    });
    const issued = await repos(receptionist).bills.issue(draft.id, draft.version);
    await repos(receptionist).payments.record({
      patientId: PATIENT_ID,
      amountPaise: 100_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });

    await expect(
      repos(doctor).bills.cancel(issued.id, issued.version, "mistake"),
    ).rejects.toBeInstanceOf(InvalidError);

    await expect(
      repos(receptionist).bills.cancel(issued.id, issued.version, "mistake"),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const unpaidDraft = await repos(receptionist).bills.create({
      patientId: PATIENT_ID,
      billOn: "2026-11-23",
      items: [{ procedureLabel: "Fake unpaid", qty: 1, unitPaise: 50_00 }],
    });
    const unpaidIssued = await repos(receptionist).bills.issue(unpaidDraft.id, unpaidDraft.version);
    const cancelled = await repos(doctor).bills.cancel(
      unpaidIssued.id,
      unpaidIssued.version,
      "Entered in error",
    );
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.billNo).toBe(unpaidIssued.billNo);
    expect(cancelled.cancelReason).toBe("Entered in error");
  });
});

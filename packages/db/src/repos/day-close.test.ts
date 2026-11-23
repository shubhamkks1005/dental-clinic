import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = receptionist) => createRepos(t.db, ctx);
const DAY = "2026-11-23";

beforeEach(() => {
  t = testDb();
  for (let i = 0; i < 10; i++) {
    const id = `01M85PATIENTDAYCLOSE${String(i).padStart(2, "0")}`;
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
      )
      .run(id, `P-0099${10 + i}`, `Fake Day Close ${i}`, `+9199000019${10 + i}`);
  }
});

async function pay(i: number, amountPaise: number, mode: "cash" | "upi") {
  const patientId = `01M85PATIENTDAYCLOSE${String(i).padStart(2, "0")}`;
  const draft = await repos().bills.create({
    patientId,
    billOn: DAY,
    items: [{ procedureLabel: "Fake day item", qty: 1, unitPaise: amountPaise }],
  });
  await repos().bills.issue(draft.id, draft.version);
  return repos().payments.record({
    patientId,
    amountPaise,
    mode,
    dayLocal: DAY,
  });
}

describe("day close (5.3.9)", () => {
  it("refuses close while incomplete appointments remain (6.2.4)", async () => {
    const statuses = ["scheduled", "arrived", "confirmed"] as const;
    for (let i = 0; i < 3; i++) {
      t.sqlite
        .prepare(
          `INSERT INTO appointments (
             id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
             start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at
           ) VALUES (
             ?, 'system', 'system', ?, '1', 'vt1', 'Consultation',
             '2026-11-23T04:30:00.000Z', ?, ?, ?, ?, 'phone', 'normal', 0, 1,
             '2026-11-23T04:30:00.000Z'
           )`,
        )
        .run(
          `a-open-${i}`,
          `01M85PATIENTDAYCLOSE${String(i).padStart(2, "0")}`,
          DAY,
          600 + i * 30,
          630 + i * 30,
          statuses[i],
        );
    }
    await expect(
      repos().dayClose.close({ dayLocal: DAY, cashCountedPaise: 0, note: "" }),
    ).rejects.toThrow(/3 open appointment/);
    const summary = await repos().dayClose.summary(DAY);
    expect(summary.incompleteAppointments).toHaveLength(3);
    // Q1.4: the blockers list names the patients so the desk can open them.
    expect(summary.incompleteAppointments.every((a) => /^Fake Day Close/.test(a.patientName))).toBe(
      true,
    );
  });

  it("closes a 10-payment day with zero difference and locks further entries", async () => {
    for (let i = 0; i < 7; i++) await pay(i, 100_00, "cash");
    for (let i = 7; i < 10; i++) await pay(i, 50_00, "upi");

    const summary = await repos().dayClose.summary(DAY);
    expect(summary.paymentCount).toBe(10);
    expect(summary.cashExpectedPaise).toBe(700_00);
    expect(summary.digitalPaise).toBe(150_00);

    const closed = await repos().dayClose.close({
      dayLocal: DAY,
      cashCountedPaise: 700_00,
      note: "",
    });
    expect(closed.closed).toBe(true);
    expect(closed.close?.differencePaise).toBe(0);

    await expect(
      repos().payments.record({
        patientId: "01M85PATIENTDAYCLOSE00",
        amountPaise: 10_00,
        mode: "cash",
        dayLocal: DAY,
        allowAdvance: true,
      }),
    ).rejects.toBeInstanceOf(InvalidError);

    const late = await repos().payments.record({
      patientId: "01M85PATIENTDAYCLOSE00",
      amountPaise: 10_00,
      mode: "cash",
      dayLocal: DAY,
      allowAdvance: true,
      lateEntry: true,
    });
    expect(late).toBeTruthy();

    await repos(doctor).dayClose.reopen({ dayLocal: DAY, reason: "Forgot a cash receipt" });
    const again = await repos().dayClose.summary(DAY);
    expect(again.closed).toBe(false);
  });

  it("requires a note when cash difference is not zero", async () => {
    await pay(0, 100_00, "cash");
    await expect(
      repos().dayClose.close({ dayLocal: DAY, cashCountedPaise: 90_00, note: "" }),
    ).rejects.toBeInstanceOf(InvalidError);
  });
});

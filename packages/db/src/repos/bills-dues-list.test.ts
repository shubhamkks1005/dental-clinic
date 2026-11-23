import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const P1 = "01M85PATIENTDUESTEST001";
const P2 = "01M85PATIENTDUESTEST002";

beforeEach(() => {
  t = testDb();
  for (const [id, code, name, mobile] of [
    [P1, "P-009801", "Fake Due Alpha", "+919900009801"],
    [P2, "P-009802", "Fake Due Beta", "+919900009802"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
      )
      .run(id, code, name, mobile);
  }
});

async function issued(patientId: string, totalPaise: number, billOn: string) {
  const draft = await repos(receptionist).bills.create({
    patientId,
    billOn,
    items: [{ procedureLabel: "Fake due item", qty: 1, unitPaise: totalPaise }],
  });
  return repos(receptionist).bills.issue(draft.id, draft.version);
}

describe("dues list (5.3.4)", () => {
  it("lists all debtors; bucket totals match account outstanding", async () => {
    await issued(P1, 100_00, "2026-11-20");
    await issued(P2, 250_00, "2026-09-01");
    await repos(receptionist).payments.record({
      patientId: P1,
      amountPaise: 40_00,
      mode: "cash",
      dayLocal: "2026-11-23",
    });

    const list = await repos(receptionist).bills.listDues(new Date("2026-11-23T12:00:00Z"));
    expect(list.totalDuePaise).toBe(60_00 + 250_00);
    expect(list.rows).toHaveLength(2);

    const alpha = list.rows.find((r) => r.patientId === P1)!;
    const beta = list.rows.find((r) => r.patientId === P2)!;
    expect(alpha.duePaise).toBe(60_00);
    expect(alpha.bucket).toBe("0-30");
    expect(beta.duePaise).toBe(250_00);
    expect(beta.bucket).toBe("61+");
    expect(list.byBucket["0-30"] + list.byBucket["31-60"] + list.byBucket["61+"]).toBe(
      list.totalDuePaise,
    );

    await repos(receptionist).duesCalls.record(P1, {
      note: "Fake call — will pay next week",
      calledOn: "2026-11-22",
    });
    const again = await repos(receptionist).bills.listDues(new Date("2026-11-23T12:00:00Z"));
    expect(again.rows.find((r) => r.patientId === P1)?.lastCallNote).toMatch(/Fake call/);
  });

  it("duesForPatients matches open dues for appointment cards", async () => {
    await issued(P1, 80_00, "2026-11-10");
    const map = await repos(receptionist).bills.duesForPatients([P1, P2]);
    expect(map.get(P1)).toBe(80_00);
    expect(map.has(P2)).toBe(false);
  });
});

import { createRepos } from "@clinic/db";
import { testDb } from "@clinic/db/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { billStateWord } from "@clinic/shared";
import { createBillFromVisit } from "./bills";

// D5: a bill from a finalised visit is issued straight away; "Review first" keeps a draft.
const ctx = { userId: "rec-1", role: "receptionist" as const, requestId: "r1" };
const doctor = { userId: "doc-a", role: "doctor" as const, requestId: "r2" };
let t: ReturnType<typeof testDb>;
const PATIENT = "01M85PATIENTDOMBILL00001";

async function visitWithProcedure(label: string, paise: number, day = "2026-11-23") {
  const listed = await createRepos(t.db, doctor).lists.add("procedures", {
    label,
    data: { default_paise: paise, code: label.slice(0, 6).toUpperCase() },
  });
  const item = listed.find((i) => i.label === label)!;
  const visit = await createRepos(t.db, doctor).visits.open({
    patientId: PATIENT,
    visitDateLocal: day,
  });
  await createRepos(t.db, doctor).visitProcedures.add({ visitId: visit.id, listItemId: item.id });
  return visit.id;
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009911', 'Fake Domain Bill Patient', 'female', 30, '+919900001911', 'active')`,
    )
    .run(PATIENT);
});

describe("createBillFromVisit (D5)", () => {
  it("issues at once with a number, and the next bill gets the next number", async () => {
    const first = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale one", 50_000),
    );
    expect(first.bill.status).toBe("issued");
    expect(first.bill.billNo).toMatch(/^SB-/);
    const second = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale two", 70_000, "2026-11-24"),
    );
    const n = (no: string | null) => Number(no!.split("-").pop());
    expect(n(second.bill.billNo)).toBe(n(first.bill.billNo) + 1);
  });

  it("Review first keeps a draft with no number", async () => {
    const r = await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale three", 40_000),
      { reviewFirst: true },
    );
    expect(r.bill.status).toBe("draft");
    expect(r.bill.billNo).toBeNull();
  });

  it("writes an audit row for the issue", async () => {
    await createBillFromVisit(
      createRepos(t.db, ctx),
      await visitWithProcedure("Scale four", 10_000),
    );
    const rows = t.sqlite
      .prepare("SELECT after_json FROM audit_log WHERE table_name = 'bills' AND action = 'update'")
      .all() as { after_json: string }[];
    expect(rows.some((r) => r.after_json.includes('"issued"'))).toBe(true);
  });
});

// Visit finished page (handoff section 13): P1, P2, P6, P7, P10, P12.
describe("pass to reception (visit finished page)", () => {
  const rep = () => createRepos(t.db, doctor);
  const billsOf = (visitId: string) =>
    t.sqlite
      .prepare("SELECT id, bill_no, status, total_paise FROM bills WHERE visit_id = ?")
      .all(visitId) as {
      id: string;
      bill_no: string | null;
      status: string;
      total_paise: number;
    }[];

  it("P1: with procedures one bill is issued with a gap-free number and is With reception", async () => {
    const visitId = await visitWithProcedure("Scale p1", 50_000);
    const r = await createBillFromVisit(rep(), visitId);
    expect(r).toMatchObject({ created: true, bill: { status: "issued", totalPaise: 50_000 } });
    expect(r.bill.billNo).toMatch(/^SB-/);
    const state = billStateWord({ status: r.bill.status, totalPaise: r.bill.totalPaise }, 0);
    expect(state).toBe("with_reception");
  });

  it("P2: two taps one after the other, or at the same time, give one bill and one number", async () => {
    const visitId = await visitWithProcedure("Scale p2", 50_000);
    const [a, b, c] = await Promise.all([
      createBillFromVisit(rep(), visitId),
      createBillFromVisit(rep(), visitId),
      createBillFromVisit(rep(), visitId),
    ]);
    expect(new Set([a.bill.id, b.bill.id, c.bill.id]).size).toBe(1);
    expect(new Set([a.bill.billNo, b.bill.billNo, c.bill.billNo]).size).toBe(1);
    expect([a.created, b.created, c.created].filter(Boolean)).toHaveLength(1);
    expect(billsOf(visitId)).toHaveLength(1);
    const later = await createBillFromVisit(rep(), visitId);
    expect(later).toMatchObject({ created: false, bill: { id: a.bill.id, status: "issued" } });
    const counter = t.sqlite
      .prepare("SELECT COUNT(*) AS n FROM bills WHERE bill_no IS NOT NULL")
      .get() as { n: number };
    expect(counter.n).toBe(1);
  });

  it("a cancelled bill does not block a new one", async () => {
    const visitId = await visitWithProcedure("Scale cancel", 50_000);
    const first = await createBillFromVisit(rep(), visitId);
    await rep().bills.cancel(first.bill.id, first.bill.version, "Wrong fee");
    const again = await createBillFromVisit(rep(), visitId);
    expect(again.created).toBe(true);
    expect(again.bill.id).not.toBe(first.bill.id);
  });

  it("P6: a Consultation line is added next to the procedure lines and the total matches", async () => {
    const visitId = await visitWithProcedure("Scale p6", 50_000);
    const r = await createBillFromVisit(rep(), visitId, {
      reviewFirst: true,
      consultation: true,
      consultationPaise: 30_000,
    });
    expect(r.bill.status).toBe("draft");
    const lines = (await rep().bills.get(r.bill.id)).items.map((i) => [
      i.procedureLabel,
      i.unitPaise,
    ]);
    expect(lines).toEqual([
      ["Scale p6", 50_000],
      ["Consultation", 30_000],
    ]);
    expect(r.bill.totalPaise).toBe(80_000);
  });

  it("P6: the usual fee setting is used when no amount is typed; unset and no amount is refused", async () => {
    const visitId = await visitWithProcedure("Scale usual", 10_000);
    await expect(
      createBillFromVisit(rep(), visitId, { reviewFirst: true, consultation: true }),
    ).rejects.toThrow("Enter the consultation fee.");
    t.sqlite
      .prepare(
        "UPDATE settings SET value_json = '25000' WHERE key = 'billing.consultation_fee_paise'",
      )
      .run();
    const r = await createBillFromVisit(rep(), visitId, { reviewFirst: true, consultation: true });
    expect(r.bill.totalPaise).toBe(35_000);
  });

  it("P10: nothing billable makes no bill; a consultation alone does", async () => {
    const visit = await rep().visits.open({ patientId: PATIENT, visitDateLocal: "2026-11-24" });
    await expect(createBillFromVisit(rep(), visit.id)).rejects.toThrow(
      "There is nothing to bill on this visit",
    );
    expect(billsOf(visit.id)).toHaveLength(0);
    const r = await createBillFromVisit(rep(), visit.id, {
      consultation: true,
      consultationPaise: 40_000,
    });
    expect(r.bill).toMatchObject({ status: "issued", totalPaise: 40_000 });
  });

  it("a bad amount is a 400 style error, not a bill", async () => {
    const visitId = await visitWithProcedure("Scale bad", 10_000);
    await expect(
      createBillFromVisit(rep(), visitId, { consultation: true, consultationPaise: -5 }),
    ).rejects.toThrow();
    expect(billsOf(visitId)).toHaveLength(0);
  });

  it("P12: a procedure without a fee is billed at 0 and keeps its name", async () => {
    const listed = await rep().lists.add("procedures", {
      label: "Free review",
      data: { default_paise: 0, code: "FREE" },
    });
    const item = listed.find((i) => i.label === "Free review")!;
    const visit = await rep().visits.open({ patientId: PATIENT, visitDateLocal: "2026-11-26" });
    await rep().visitProcedures.add({ visitId: visit.id, listItemId: item.id });
    t.sqlite
      .prepare("UPDATE visit_procedures SET default_paise = NULL WHERE visit_id = ?")
      .run(visit.id);
    const r = await createBillFromVisit(rep(), visit.id, { reviewFirst: true });
    const lines = (await rep().bills.get(r.bill.id)).items;
    expect(lines.map((i) => [i.procedureLabel, i.unitPaise])).toEqual([["Free review", 0]]);
  });
});

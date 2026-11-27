import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M87PATIENTBILLNOTE001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009992', 'Fake Note Bill Patient', 'female', 31, '+919900099921', 'active')`,
    )
    .run(PATIENT_ID);
});

const draft = () =>
  repos().bills.create({
    patientId: PATIENT_ID,
    billOn: "2026-11-25",
    items: [{ procedureLabel: "Filling", qty: 1, unitPaise: 100_000 }],
  });

const money = (id: string) =>
  t.sqlite
    .prepare(
      "SELECT subtotal_paise, discount_paise, tax_paise, round_off_paise, total_paise, status, bill_no FROM bills WHERE id = ?",
    )
    .get(id);
const noteAudits = () =>
  t.sqlite
    .prepare(
      "SELECT before_json, after_json FROM audit_log WHERE table_name = 'bills' AND after_json LIKE '%notes%'",
    )
    .all() as { before_json: string; after_json: string }[];

describe("bill note (P8, P9)", () => {
  it("P8: the note of an issued bill can be changed; money and number stay; the audit row has old and new text", async () => {
    const bill = await draft();
    const issued = await repos().bills.issue(bill.id, bill.version);
    const before = money(bill.id);
    const first = await repos().bills.setNote(bill.id, {
      version: issued.version,
      note: "  Paid in two parts  ",
    });
    expect(first).toMatchObject({ notes: "Paid in two parts", version: issued.version + 1 });
    const second = await repos().bills.setNote(bill.id, {
      version: first.version,
      note: "Balance next week",
    });
    expect(second.notes).toBe("Balance next week");
    expect(money(bill.id)).toEqual(before);
    const rows = noteAudits();
    expect(rows).toHaveLength(2);
    expect(JSON.parse(rows[1]!.before_json)).toEqual({ notes: "Paid in two parts" });
    expect(JSON.parse(rows[1]!.after_json)).toEqual({ notes: "Balance next week" });
  });

  it("a draft note works and an empty note clears it", async () => {
    const bill = await draft();
    const a = await repos().bills.setNote(bill.id, {
      version: bill.version,
      note: "Ask about X-ray",
    });
    expect(a.notes).toBe("Ask about X-ray");
    const b = await repos().bills.setNote(bill.id, { version: a.version, note: "" });
    expect(b.notes).toBe("");
  });

  it("P9: a cancelled bill is refused", async () => {
    const bill = await draft();
    const issued = await repos().bills.issue(bill.id, bill.version);
    const cancelled = await repos().bills.cancel(bill.id, issued.version, "Wrong patient");
    await expect(
      repos().bills.setNote(bill.id, { version: cancelled.version, note: "Late" }),
    ).rejects.toBeInstanceOf(InvalidError);
    expect((await repos().bills.get(bill.id)).notes).toBe("");
  });

  it("a stale version is a conflict, an unknown bill is not found, and the desk may write it too", async () => {
    const bill = await draft();
    await expect(
      repos().bills.setNote(bill.id, { version: bill.version + 4, note: "x" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(repos().bills.setNote("nope", { version: 1, note: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    // Owner 2026-11-26: the desk only reads the note.
    await expect(
      repos(receptionist).bills.setNote(bill.id, { version: bill.version, note: "Desk note" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(noteAudits().length).toBe(0);
  });

  it("someone without bill rights is refused", async () => {
    const bill = await draft();
    const dev: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };
    await expect(
      repos(dev).bills.setNote(bill.id, { version: bill.version, note: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

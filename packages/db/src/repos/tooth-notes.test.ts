import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const P1 = "01M83PATIENTTOOTHNOTE01";
const P2 = "01M83PATIENTTOOTHNOTE02";

beforeEach(() => {
  t = testDb();
  for (const [id, code] of [
    [P1, "P-009951"],
    [P2, "P-009952"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, 'Fake Note Patient', 'male', 33, ?, 'active')`,
      )
      .run(id, code, `+9199000${code.slice(-5)}`);
  }
});

const open = (patientId = P1) => repos().visits.open({ patientId, visitDateLocal: "2026-11-25" });
const audit = (action: string) =>
  (
    t.sqlite
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action = ? AND table_name = 'tooth_notes'",
      )
      .get(action) as { n: number }
  ).n;

describe("per-tooth clinical note (B7)", () => {
  it("creates, changes and clears a note, with a version check and audit rows", async () => {
    const visit = await open();
    expect(await repos().toothNotes.get(P1, 36)).toBeNull();

    const first = await repos().toothNotes.save(P1, 36, {
      visitId: visit.id,
      body: "  Sensitive to cold ",
    });
    expect(first).toMatchObject({ body: "Sensitive to cold", version: 1, toothFdi: 36 });

    const second = await repos().toothNotes.save(P1, 36, {
      visitId: visit.id,
      body: "Sensitive to cold, review in 2 weeks",
      version: 1,
    });
    expect(second).toMatchObject({ version: 2 });

    await expect(
      repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "late", version: 1 }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "no version" }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(
      await repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "  ", version: 2 }),
    ).toBeNull();
    expect(await repos().toothNotes.get(P1, 36)).toBeNull();
    expect([audit("create"), audit("update"), audit("delete")]).toEqual([1, 1, 1]);

    // After a clear a fresh note starts again at version 1.
    const again = await repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "New start" });
    expect(again?.version).toBe(1);
  });

  it("keeps notes per patient and per tooth; clearing a missing note does nothing", async () => {
    const visit = await open();
    await repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "A" });
    expect(await repos().toothNotes.get(P1, 37)).toBeNull();
    expect(await repos().toothNotes.get(P2, 36)).toBeNull();
    expect(await repos().toothNotes.save(P1, 46, { visitId: visit.id, body: "" })).toBeNull();
  });

  it("refuses a bad tooth, a long note, a receptionist, a finalised or another patient's visit", async () => {
    const visit = await open();
    const other = await open(P2);
    await expect(
      repos().toothNotes.save(P1, 19, { visitId: visit.id, body: "x" }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "x".repeat(1001) }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos(receptionist).toothNotes.save(P1, 36, { visitId: visit.id, body: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(repos(receptionist).toothNotes.get(P1, 36)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      repos().toothNotes.save(P1, 36, { visitId: other.id, body: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const fresh = await repos().visits.getById(visit.id);
    await repos().visits.finalise(visit.id, { version: fresh.version });
    await expect(
      repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "x" }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("a finalised visit keeps the note text of that day in its snapshot", async () => {
    const visit = await open();
    await repos().toothNotes.save(P1, 36, { visitId: visit.id, body: "Watch cusp" });
    const fresh = await repos().visits.getById(visit.id);
    await repos().visits.finalise(visit.id, { version: fresh.version });

    const next = await open();
    const note = await repos().toothNotes.get(P1, 36);
    await repos().toothNotes.save(P1, 36, {
      visitId: next.id,
      body: "Cusp restored",
      version: note?.version,
    });

    const row = t.sqlite
      .prepare("SELECT snapshot_json AS s FROM visits WHERE id = ?")
      .get(visit.id) as { s: string };
    const snap = JSON.parse(row.s) as { toothNotes: { toothFdi: number; body: string }[] };
    expect(snap.toothNotes).toEqual([
      expect.objectContaining({ toothFdi: 36, body: "Watch cusp" }),
    ]);
  });

  it("only one live note per tooth can exist (unique index)", () => {
    const ins = (id: string) =>
      t.sqlite
        .prepare(
          `INSERT INTO tooth_notes (id, created_by, updated_by, patient_id, tooth_fdi, body) VALUES (?, 's', 's', ?, 36, 'x')`,
        )
        .run(id, P1);
    ins("n1");
    expect(() => ins("n2")).toThrow();
    t.sqlite
      .prepare("UPDATE tooth_notes SET deleted_at = '2026-11-25T00:00:00.000Z' WHERE id = 'n1'")
      .run();
    expect(() => ins("n3")).not.toThrow();
  });
});

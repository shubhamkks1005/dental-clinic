import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTLINEEDIT001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009921', 'Fake Line Patient', 'female', 33, '+919900001555', 'active')`,
    )
    .run(PATIENT_ID);
});

async function draftWithLines() {
  const procs = await repos().lists.add("procedures", {
    label: "Line edit filling (test)",
    data: { default_paise: 100000, code: "LNE" },
  });
  const item = procs.find((i) => i.label === "Line edit filling (test)")!;
  const visit = await repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-11-25" });
  const dx = await repos().visitDiagnoses.add({ visitId: visit.id, freeText: "Deep caries" });
  const proc = await repos().visitProcedures.add({ visitId: visit.id, listItemId: item.id });
  return { visit, dx, proc };
}

const auditCount = (action: string, table: string) =>
  (
    t.sqlite
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = ? AND table_name = ?")
      .get(action, table) as { n: number }
  ).n;

describe("diagnosis line edit (B2)", () => {
  it("rejects a bad FDI on add and on update", async () => {
    const { visit, dx } = await draftWithLines();
    await expect(
      repos().visitDiagnoses.add({ visitId: visit.id, freeText: "x", toothFdi: 19 }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().visitDiagnoses.update(dx.id, dx.version, { toothFdi: 99 }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("changes the tooth, bumps the version, writes one audit row", async () => {
    const { dx } = await draftWithLines();
    const next = await repos().visitDiagnoses.update(dx.id, dx.version, { toothFdi: 36 });
    expect(next).toMatchObject({ toothFdi: 36, version: dx.version + 1 });
    expect(auditCount("update", "visit_diagnoses")).toBe(1);
    await expect(
      repos().visitDiagnoses.update(dx.id, dx.version, { toothFdi: 37 }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(auditCount("update", "visit_diagnoses")).toBe(1);
  });

  it("remove then undo five times keeps one line and writes 5 + 5 audit rows", async () => {
    const { visit, dx } = await draftWithLines();
    let version = dx.version;
    for (let i = 0; i < 5; i++) {
      const gone = await repos().visitDiagnoses.remove(dx.id, version);
      expect(await repos().visitDiagnoses.listForVisit(visit.id)).toHaveLength(0);
      const back = await repos().visitDiagnoses.restore(dx.id, gone.version);
      version = back.version;
      expect(await repos().visitDiagnoses.listForVisit(visit.id)).toHaveLength(1);
    }
    expect(auditCount("delete", "visit_diagnoses")).toBe(5);
    expect(auditCount("restore", "visit_diagnoses")).toBe(5);
  });

  it("refuses a receptionist, a removed line and a finalised visit", async () => {
    const { visit, dx } = await draftWithLines();
    await expect(
      repos(receptionist).visitDiagnoses.remove(dx.id, dx.version),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const gone = await repos().visitDiagnoses.remove(dx.id, dx.version);
    await expect(
      repos().visitDiagnoses.update(dx.id, gone.version, { toothFdi: 36 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await repos().visitDiagnoses.restore(dx.id, gone.version);
    const fresh = await repos().visits.getById(visit.id);
    await repos().visits.finalise(visit.id, { version: fresh.version });
    await expect(repos().visitDiagnoses.remove(dx.id, gone.version + 1)).rejects.toBeInstanceOf(
      InvalidError,
    );
  });
});

describe("procedure line edit (B2)", () => {
  it("changes tooth, surfaces and note; dedupes surfaces; validates", async () => {
    const { proc } = await draftWithLines();
    const next = await repos().visitProcedures.update(proc.id, proc.version, {
      toothFdi: 46,
      surfaces: ["o", "m", "o"],
      note: "  Shade A2 ",
    });
    expect(next).toMatchObject({
      toothFdi: 46,
      surfaces: ["o", "m"],
      note: "Shade A2",
      version: proc.version + 1,
    });
    await expect(
      repos().visitProcedures.update(proc.id, next.version, { toothFdi: 19 }),
    ).rejects.toBeInstanceOf(InvalidError);
    const cleared = await repos().visitProcedures.update(proc.id, next.version, { note: null });
    expect(cleared.note).toBeNull();
    expect(cleared.toothFdi).toBe(46);
    expect(auditCount("update", "visit_procedures")).toBe(2);
  });

  it("remove then undo keeps the line in place; stale version conflicts", async () => {
    const { visit, proc } = await draftWithLines();
    const gone = await repos().visitProcedures.remove(proc.id, proc.version);
    expect(await repos().visitProcedures.listForVisit(visit.id)).toHaveLength(0);
    await expect(repos().visitProcedures.restore(proc.id, proc.version)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const back = await repos().visitProcedures.restore(proc.id, gone.version);
    expect(back.id).toBe(proc.id);
    expect(await repos().visitProcedures.listForVisit(visit.id)).toHaveLength(1);
    expect(auditCount("delete", "visit_procedures")).toBe(1);
    expect(auditCount("restore", "visit_procedures")).toBe(1);
  });

  it("refuses a receptionist and a finalised visit", async () => {
    const { visit, proc } = await draftWithLines();
    await expect(
      repos(receptionist).visitProcedures.update(proc.id, proc.version, { note: "x" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const fresh = await repos().visits.getById(visit.id);
    await repos().visits.finalise(visit.id, { version: fresh.version });
    await expect(repos().visitProcedures.remove(proc.id, proc.version)).rejects.toBeInstanceOf(
      InvalidError,
    );
  });
});

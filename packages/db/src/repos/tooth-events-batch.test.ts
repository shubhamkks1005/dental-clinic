import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError, NotFoundError } from "../errors";
import { countingDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof countingDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

beforeEach(() => {
  t = countingDb();
  for (const [id, code] of [
    ["p1", "P-009971"],
    ["p2", "P-009972"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 's', 's', ?, 'Fake Chart Patient', 'female', 29, ?, 'active')`,
      )
      .run(id, code, `+9199000${code.slice(-5)}`);
  }
});

const open = (patientId = "p1") => repos().visits.open({ patientId, visitDateLocal: "2026-11-25" });
const mark = (toothFdi: number, surface: string, conditionCode: string) => ({
  toothFdi,
  surface,
  conditionCode,
});

describe("chart marks in one request (B9)", () => {
  it("saves several marks with one batch, in order, and the last mark per surface wins", async () => {
    const visit = await open();
    t.reset();
    const { ids } = await repos().toothEvents.addMany("p1", visit.id, [
      mark(36, "o", "caries"),
      mark(36, "o", "filling"),
      mark(46, "m", "caries"),
    ]);
    expect(ids).toHaveLength(3);
    // one read of patient and visit, one write batch
    expect(t.counts().roundTrips).toBe(2);

    const chart = await repos().toothEvents.chartForPatient("p1");
    const cell = (fdi: number, surface: string) =>
      chart.cells.find((c) => c.toothFdi === fdi && c.surface === surface)?.conditionCode;
    expect(cell(36, "o")).toBe("filling");
    expect(cell(46, "m")).toBe("caries");
    const audits = t.sqlite
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE table_name = 'tooth_events'")
      .get() as { n: number };
    expect(audits.n).toBe(3);
  });

  it("an empty group does nothing; one bad mark saves none of them", async () => {
    const visit = await open();
    expect(await repos().toothEvents.addMany("p1", visit.id, [])).toEqual({ ids: [] });
    await expect(
      repos().toothEvents.addMany("p1", visit.id, [
        mark(36, "o", "caries"),
        mark(19, "o", "caries"),
      ]),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().toothEvents.addMany("p1", visit.id, [mark(36, "x", "caries")]),
    ).rejects.toBeInstanceOf(InvalidError);
    const n = t.sqlite.prepare("SELECT COUNT(*) AS n FROM tooth_events").get() as { n: number };
    expect(n.n).toBe(0);
  });

  it("refuses more than 40 marks, a receptionist, another patient's visit and a finalised visit", async () => {
    const visit = await open();
    const other = await open("p2");
    const many = Array.from({ length: 41 }, () => mark(36, "o", "caries"));
    await expect(repos().toothEvents.addMany("p1", visit.id, many)).rejects.toBeInstanceOf(
      InvalidError,
    );
    await expect(
      repos(receptionist).toothEvents.addMany("p1", visit.id, [mark(36, "o", "caries")]),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      repos().toothEvents.addMany("p1", other.id, [mark(36, "o", "caries")]),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().toothEvents.addMany("p1", "nope", [mark(36, "o", "caries")]),
    ).rejects.toBeInstanceOf(NotFoundError);
    const fresh = await repos().visits.getById(visit.id);
    await repos().visits.finalise(visit.id, { version: fresh.version });
    await expect(
      repos().toothEvents.addMany("p1", visit.id, [mark(36, "o", "caries")]),
    ).rejects.toBeInstanceOf(InvalidError);
  });
});

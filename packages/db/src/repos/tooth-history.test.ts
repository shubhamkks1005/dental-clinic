import { describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { countingDb, recordingDb, scansIn } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const NOW = new Date("2026-11-25T05:00:00.000Z");

type Sqlite = ReturnType<typeof countingDb>["sqlite"];
let seq = 0;
const uid = (p: string) => `${p}${String(++seq).padStart(5, "0")}`;

function base(sqlite: Sqlite) {
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-009981', 'Fake History Patient', 'female', 12, '+919900099811', 'active')`,
    )
    .run();
  const visit = (id: string, day: string, status: string) =>
    sqlite
      .prepare(
        `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
         VALUES (?, 's', 's', 'p1', 'doc-a', ?, ?)`,
      )
      .run(id, day, status);
  visit("v1", "2026-10-01", "final");
  visit("v2", "2026-10-15", "final");
  visit("vvoid", "2026-10-20", "void");
  visit("vdraft", "2026-11-25", "draft");
  return {
    event: (tooth: number, surface: string, code: string, at: string, visitId: string | null) =>
      sqlite
        .prepare(
          `INSERT INTO tooth_events (id, created_by, updated_by, patient_id, tooth_fdi, surface, condition_code, visit_id, noted_at, noted_by)
           VALUES (?, 's', 's', 'p1', ?, ?, ?, ?, ?, 'doc-a')`,
        )
        .run(uid("ev"), tooth, surface, code, visitId, at),
    proc: (tooth: number, label: string, at: string, visitId: string, deleted = false) =>
      sqlite
        .prepare(
          `INSERT INTO visit_procedures (id, created_by, updated_by, visit_id, label, tooth_fdi, surfaces_json, created_at, deleted_at)
           VALUES (?, 's', 's', ?, ?, ?, '["o","d"]', ?, ?)`,
        )
        .run(uid("pr"), visitId, label, tooth, at, deleted ? at : null),
    diag: (tooth: number, label: string, at: string, visitId: string) =>
      sqlite
        .prepare(
          `INSERT INTO visit_diagnoses (id, created_by, updated_by, visit_id, label, tooth_fdi, created_at)
           VALUES (?, 's', 's', ?, ?, ?, ?)`,
        )
        .run(uid("dx"), visitId, label, tooth, at),
    file: (tooth: number, name: string, at: string) =>
      sqlite
        .prepare(
          `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, original_filename, tooth_fdi, created_at)
           VALUES (?, 's', 's', 'p1', ?, 'iopa', 'image/jpeg', 10, ?, ?, ?, ?)`,
        )
        .run(uid("fl"), uid("key"), "a".repeat(64), name, tooth, at),
  };
}

const T = (d: string, h = "05") => `2026-${d}T${h}:00:00.000Z`;

describe("tooth history (B10)", () => {
  it("case 19: five sources in one request, newest first, grouped, 6 queries or fewer", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    s.event(36, "o", "caries", T("10-01", "05"), "v1");
    s.event(36, "d", "caries", T("10-01", "06"), "v1");
    s.diag(36, "Irreversible pulpitis", T("10-15", "05"), "v2");
    s.proc(36, "RCT started", T("10-15", "06"), "v2");
    s.file(36, "xray.jpg", T("10-16"));
    s.proc(36, "Temporary filling", T("11-25", "04"), "vdraft");
    s.event(36, "o", "filling", T("11-25", "04"), "vdraft");
    t.sqlite
      .prepare(
        `INSERT INTO plan_items (id, created_by, updated_by, patient_id, tooth_fdi, procedure_label, estimate_paise, status)
         VALUES ('pi', 's', 's', 'p1', 36, 'Crown', 800000, 'planned')`,
      )
      .run();
    const repos = createRepos(t.db, doctor);
    t.reset();
    const h = await repos.toothHistory.get("p1", 36, { now: NOW });
    expect(t.counts()).toMatchObject({ roundTrips: 1 });
    expect(t.counts().statements).toBeLessThanOrEqual(6);

    expect(h.entries.map((e) => `${e.kind}:${e.title}`)).toEqual([
      "procedure:Temporary filling",
      "chart:filling",
      "file:xray.jpg",
      "procedure:RCT started",
      "diagnosis:Irreversible pulpitis",
      "chart:caries",
    ]);
    expect(h.entries[0]).toMatchObject({ isToday: true, surfaces: ["o", "d"] });
    expect(h.entries[5]).toMatchObject({ surfaces: ["o", "d"], visitId: "v1", isToday: false });
    expect(h.entries[2]).toMatchObject({ fileId: expect.any(String) });
    expect(h.plan.map((p) => p.procedureLabel)).toEqual(["Crown"]);
    expect(h.next).toBeNull();
  });

  it("case 20: a tooth with nothing on record", async () => {
    const t = countingDb();
    base(t.sqlite);
    const h = await createRepos(t.db, doctor).toothHistory.get("p1", 11, { now: NOW });
    expect(h).toMatchObject({
      entries: [],
      next: null,
      plan: [],
      note: null,
      permanentTooth: null,
    });
  });

  it("leaves out void visits, soft-deleted lines, other days' drafts and other patients", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    s.proc(36, "In a void visit", T("10-20"), "vvoid");
    s.event(36, "o", "caries", T("10-20"), "vvoid");
    s.proc(36, "Deleted line", T("10-15"), "v2", true);
    t.sqlite
      .prepare(
        `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
         VALUES ('vold', 's', 's', 'p1', 'doc-a', '2026-11-01', 'draft')`,
      )
      .run();
    s.proc(36, "Old stale draft", T("11-01"), "vold");
    s.proc(36, "Kept", T("10-15", "07"), "v2");
    const h = await createRepos(t.db, doctor).toothHistory.get("p1", 36, { now: NOW });
    expect(h.entries.map((e) => e.title)).toEqual(["Kept"]);
  });

  it("case 21: 25 entries come as 20 and then 5, with no repeat", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    for (let i = 0; i < 25; i++) {
      s.diag(36, `Dx ${i}`, `2026-10-${String(1 + i).padStart(2, "0")}T05:00:00.000Z`, "v1");
    }
    const repos = createRepos(t.db, doctor);
    const first = await repos.toothHistory.get("p1", 36, { now: NOW });
    expect(first.entries).toHaveLength(20);
    expect(first.next).not.toBeNull();
    const second = await repos.toothHistory.get("p1", 36, { before: first.next, now: NOW });
    expect(second.entries).toHaveLength(5);
    expect(second.next).toBeNull();
    const ids = [...first.entries, ...second.entries].map((e) => e.id);
    expect(new Set(ids).size).toBe(25);
    expect(second.entries[4]?.title).toBe("Dx 0");
  });

  it("case 24: a permanent tooth also shows its baby tooth, tagged and sorted by date", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    s.proc(54, "Pulpotomy", T("10-01"), "v1");
    s.diag(14, "Caries", T("10-15"), "v2");
    const repos = createRepos(t.db, doctor);
    t.reset();
    const h = await repos.toothHistory.get("p1", 14, { now: NOW });
    expect(h.teeth).toEqual([14, 54]);
    expect(h.entries.map((e) => [e.title, e.fromTooth])).toEqual([
      ["Caries", null],
      ["Pulpotomy", 54],
    ]);
    expect(t.counts()).toMatchObject({ roundTrips: 1, statements: 6 });
  });

  it("case 25: a molar has no baby tooth and no link", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    s.proc(56, "Not mine", T("10-01"), "v1");
    s.diag(16, "Caries", T("10-15"), "v2");
    const h = await createRepos(t.db, doctor).toothHistory.get("p1", 16, { now: NOW });
    expect(h.teeth).toEqual([16]);
    expect(h.entries.map((e) => e.title)).toEqual(["Caries"]);
    expect(h.permanentTooth).toBeNull();
  });

  it("case 26: a baby tooth links to its permanent tooth but does not show its rows", async () => {
    const t = countingDb();
    const s = base(t.sqlite);
    s.proc(54, "Pulpotomy", T("10-01"), "v1");
    s.diag(14, "Caries", T("10-15"), "v2");
    const repos = createRepos(t.db, doctor);
    t.reset();
    const h = await repos.toothHistory.get("p1", 54, { now: NOW });
    expect(h.entries.map((e) => e.title)).toEqual(["Pulpotomy"]);
    expect(h.permanentTooth).toBe(14);
    expect(t.counts()).toMatchObject({ roundTrips: 1, statements: 7 });
    // no link when the permanent tooth has nothing yet
    const none = await repos.toothHistory.get("p1", 55, { now: NOW });
    expect(none.permanentTooth).toBeNull();
  });

  it("shows the tooth note of this tooth only", async () => {
    const t = countingDb();
    base(t.sqlite);
    t.sqlite
      .prepare(
        `INSERT INTO tooth_notes (id, created_by, updated_by, patient_id, tooth_fdi, body)
         VALUES ('n1', 's', 's', 'p1', 36, 'Watch the cusp'), ('n2', 's', 's', 'p1', 37, 'Other')`,
      )
      .run();
    const h = await createRepos(t.db, doctor).toothHistory.get("p1", 36, { now: NOW });
    expect(h.note).toMatchObject({ id: "n1", body: "Watch the cusp", version: 1 });
  });

  it("case 23 and bad input: a receptionist is refused; a bad tooth or cursor is a 4xx error", async () => {
    const t = countingDb();
    base(t.sqlite);
    await expect(createRepos(t.db, receptionist).toothHistory.get("p1", 36)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(createRepos(t.db, doctor).toothHistory.get("p1", 19)).rejects.toBeInstanceOf(
      InvalidError,
    );
    await expect(
      createRepos(t.db, doctor).toothHistory.get("p1", 36, { before: "garbage" }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("every statement uses an index (query-plan test)", async () => {
    const t = recordingDb();
    const s = base(t.sqlite);
    s.event(14, "o", "caries", T("10-01"), "v1");
    s.proc(54, "Pulpotomy", T("10-01"), "v1");
    s.diag(14, "Caries", T("10-15"), "v2");
    s.file(14, "x.jpg", T("10-16"));
    await createRepos(t.db, doctor).toothHistory.get("p1", 14, {
      before: `${T("11-20")}|zzz`,
      now: NOW,
    });
    await createRepos(t.db, doctor).toothHistory.get("p1", 54, { now: NOW });
    expect(t.ran.length).toBeGreaterThanOrEqual(13);
    expect(scansIn(t.sqlite, t.ran)).toEqual([]);
  });
});

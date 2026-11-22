import { firstPage } from "@clinic/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { patients } from "../schema";
import { rebuildPatientSearchStatements } from "../search/patient-tokens";
import { testDb } from "../testing";
import { createRepos } from "./index";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

const doctor: Ctx = { userId: "doc-1", role: "doctor", requestId: "r1" };

beforeEach(async () => {
  sqlite.exec("DELETE FROM audit_log; DELETE FROM patient_search; DELETE FROM patients;");
  await db.insert(patients).values({
    id: "p1",
    code: "P-000001",
    fullName: "Fake Active",
    gender: "female",
    ageYearsAtReg: 30,
    mobile: "+919000000001",
    status: "active",
    createdBy: "system",
    updatedBy: "system",
  });
  await db.batch([
    ...rebuildPatientSearchStatements(
      db,
      "p1",
      {
        fullName: "Fake Active",
        code: "P-000001",
        mobile: "+919000000001",
        mobileSecondary: null,
        legacyRef: null,
      },
      "system",
    ),
  ]);
});

describe("patient archive / restore (2.1.8)", () => {
  it("hides archived patients from the default list and shows them when asked", async () => {
    const repos = createRepos(db, doctor);
    await repos.patients.archive("p1", "Left town (fake)", 1);
    expect((await repos.patients.list(firstPage())).total).toBe(0);
    const archived = await repos.patients.list(firstPage(), { status: "archived" });
    expect(archived.rows.map((r) => r.code)).toEqual(["P-000001"]);
    expect(archived.rows[0]?.status).toBe("archived");
  });

  it("restores an archived patient back into the default list", async () => {
    const repos = createRepos(db, doctor);
    await repos.patients.archive("p1", "Duplicate card (fake)", 1);
    await repos.patients.restore("p1", 2);
    expect((await repos.patients.list(firstPage())).total).toBe(1);
    const audits = sqlite
      .prepare("SELECT action FROM audit_log WHERE table_name = 'patients' ORDER BY created_at")
      .all() as { action: string }[];
    expect(audits.map((a) => a.action)).toEqual(["update", "restore"]);
  });

  it("requires a reason and a matching version", async () => {
    const repos = createRepos(db, doctor);
    await expect(repos.patients.archive("p1", " ", 1)).rejects.toBeInstanceOf(InvalidError);
    await expect(repos.patients.archive("p1", "ok", 99)).rejects.toBeInstanceOf(ConflictError);
  });

  it("keeps History summary and feed viewable after archive (3.5.15 / 2.1.8)", async () => {
    const repos = createRepos(db, doctor);
    sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority
         ) VALUES (
           'a-arch-1', 'system', 'system', 'p1', '1', '01M83VTYPE01CONSULT000001', 'Consultation',
           '2026-10-01T04:30:00.000Z', '2026-10-01', 600, 630, 'completed', 'phone', 'normal'
         )`,
      )
      .run();
    await repos.patients.archive("p1", "Moved away (fake)", 1);

    const summary = await repos.history.getSummary("p1");
    expect(summary.totalVisits).toBe(0);

    const feed = await repos.history.listFeed("p1", { limit: 10 });
    expect(feed.entries.some((e) => e.type === "appointment")).toBe(true);
    expect((await repos.patients.list(firstPage())).total).toBe(0);
  });
});

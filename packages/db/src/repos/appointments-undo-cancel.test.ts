import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = receptionist) => createRepos(t.db, ctx);
const NOW = new Date("2026-11-23T04:31:00.000Z");

function addAppt(id: string, status: string, updatedAt: string) {
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at
       ) VALUES (?, 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
         '2026-11-23T04:30:00.000Z', '2026-11-23', 600, 630, ?, 'phone', 'normal', 0, 2, ?)`,
    )
    .run(id, status, updatedAt);
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Undo', 'female', 30, '+919000000002', 'active')`,
    )
    .run();
});

describe("undo after cancel (PA-M06)", () => {
  it("puts a just-cancelled appointment back and writes an audit row", async () => {
    addAppt("A1", "cancelled", "2026-11-23T04:30:30.000Z");
    const back = await repos().appointments.undoCancel("A1", 2, NOW);
    expect(back).toMatchObject({ status: "scheduled", version: 3 });
    const audit = t.sqlite
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE row_id = 'A1' AND after_json LIKE '%undoCancel%'",
      )
      .get() as { n: number };
    expect(audit.n).toBe(1);
  });

  it("refuses after the window, when not cancelled, or as an exact repeat", async () => {
    addAppt("OLD", "cancelled", "2026-11-23T04:00:00.000Z");
    await expect(repos().appointments.undoCancel("OLD", 2, NOW)).rejects.toBeInstanceOf(
      InvalidError,
    );
    addAppt("LIVE", "scheduled", "2026-11-23T04:30:30.000Z");
    await expect(repos().appointments.undoCancel("LIVE", 2, NOW)).rejects.toBeInstanceOf(
      ConflictError,
    );
    // LIVE is the same patient at the same start: the twin would be an exact repeat (clashes with
    // other patients are allowed since 2026-11-26).
    addAppt("TWIN", "cancelled", "2026-11-23T04:30:30.000Z");
    await expect(repos().appointments.undoCancel("TWIN", 2, NOW)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const row = t.sqlite.prepare("SELECT status FROM appointments WHERE id = 'TWIN'").get() as {
      status: string;
    };
    expect(row.status).toBe("cancelled");
  });

  it("a stale version is a conflict; the desk and doctor may undo, the developer may not", async () => {
    addAppt("A2", "cancelled", "2026-11-23T04:30:30.000Z");
    await expect(repos().appointments.undoCancel("A2", 1, NOW)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(repos(developer).appointments.undoCancel("A2", 2, NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect((await repos(doctor).appointments.undoCancel("A2", 2, NOW)).status).toBe("scheduled");
  });
});

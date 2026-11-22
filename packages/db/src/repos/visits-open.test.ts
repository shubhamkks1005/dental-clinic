import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTVISITTEST01";
const OTHER_PATIENT = "01M83PATIENTVISITTEST02";
const APPT_ID = "01M83APPTVISITTEST00001";
const VISIT_TYPE = "01M83VTYPE01CONSULT000001";

beforeEach(() => {
  t = testDb();
  for (const [id, code, name] of [
    [PATIENT_ID, "P-009901", "Fake Visit Patient"],
    [OTHER_PATIENT, "P-009902", "Fake Other Patient"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, ?, 'female', 30, '+919900001111', 'active')`,
      )
      .run(id, code, name);
  }
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority
       ) VALUES (
         ?, 'system', 'system', ?, '1', ?, 'Consultation',
         '2026-11-22T04:30:00.000Z', '2026-11-22', 600, 630, 'arrived', 'walk_in', 'normal'
       )`,
    )
    .run(APPT_ID, PATIENT_ID, VISIT_TYPE);
});

describe("visits open (3.2.1)", () => {
  it("creates a draft visit for an appointment and writes one audit row", async () => {
    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      appointmentId: APPT_ID,
      visitDateLocal: "2026-11-22",
    });
    expect(visit).toMatchObject({
      patientId: PATIENT_ID,
      appointmentId: APPT_ID,
      doctorId: "doc-a",
      status: "draft",
      version: 1,
    });
    const audits = t.sqlite
      .prepare(`SELECT action, table_name FROM audit_log WHERE row_id = ?`)
      .all(visit.id);
    expect(audits).toEqual([{ action: "create", table_name: "visits" }]);
  });

  it("returns the same draft on a second open; does not create another visit", async () => {
    const first = await repos().visits.open({
      patientId: PATIENT_ID,
      appointmentId: APPT_ID,
      visitDateLocal: "2026-11-22",
    });
    const second = await repos().visits.open({
      patientId: PATIENT_ID,
      appointmentId: APPT_ID,
      visitDateLocal: "2026-11-22",
    });
    expect(second.id).toBe(first.id);
    const count = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM visits WHERE appointment_id = ? AND deleted_at IS NULL`)
      .get(APPT_ID) as { n: number };
    expect(count.n).toBe(1);
    const audits = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE table_name = 'visits'`)
      .get() as { n: number };
    expect(audits.n).toBe(1);
  });

  it("refuses a second insert for the same appointment when racing past the read", async () => {
    await repos().visits.open({
      patientId: PATIENT_ID,
      appointmentId: APPT_ID,
      visitDateLocal: "2026-11-22",
    });
    // Direct insert path (as if the read missed): WHERE NOT EXISTS + unique index → no new row.
    const { insertVisitIfAppointmentFree } = await import("./visit-insert");
    const { auditInsertIfChanged } = await import("../audit");
    const id = "01M83VISITRACELOSER00001";
    await t.db.batch([
      insertVisitIfAppointmentFree(t.db, {
        id,
        patientId: PATIENT_ID,
        appointmentId: APPT_ID,
        doctorId: "doc-a",
        visitDateLocal: "2026-11-22",
        createdBy: "doc-a",
        updatedBy: "doc-a",
      }),
      auditInsertIfChanged(t.db, doctor, {
        action: "create",
        table: "visits",
        rowId: id,
        after: { status: "draft" },
      }),
    ]);
    const count = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM visits WHERE appointment_id = ?`)
      .get(APPT_ID) as { n: number };
    expect(count.n).toBe(1);
    const lost = t.sqlite.prepare(`SELECT id FROM visits WHERE id = ?`).get(id);
    expect(lost).toBeUndefined();
  });

  it("allows a visit without an appointment", async () => {
    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    expect(visit.appointmentId).toBeNull();
  });

  it("rejects receptionist", async () => {
    await expect(
      repos(receptionist).visits.open({
        patientId: PATIENT_ID,
        appointmentId: APPT_ID,
        visitDateLocal: "2026-11-22",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects appointment for a different patient", async () => {
    await expect(
      repos().visits.open({
        patientId: OTHER_PATIENT,
        appointmentId: APPT_ID,
        visitDateLocal: "2026-11-22",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects missing patient", async () => {
    await expect(
      repos().visits.open({
        patientId: "missing",
        visitDateLocal: "2026-11-22",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

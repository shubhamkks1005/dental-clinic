import { describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { openBillDues } from "./bills-dues";
import { countingDb, recordingDb, scansIn } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

const P = "01M83PATIENTVISITPAGE01";
const OTHER = "01M83PATIENTVISITPAGE02";

type Sqlite = ReturnType<typeof countingDb>["sqlite"];

function seed(sqlite: Sqlite) {
  const run = (sql: string, ...args: (string | number | null)[]) =>
    sqlite.prepare(sql).run(...args);
  for (const [id, code] of [
    [P, "P-009941"],
    [OTHER, "P-009942"],
  ] as const) {
    run(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 's', 's', ?, 'Fake Page Patient', 'female', 30, ?, 'active')`,
      id,
      code,
      `+9199000${code.slice(-5)}`,
    );
  }
  const visit = (id: string, patient: string, day: string, status: string, note: string | null) =>
    run(
      `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, exam_note, chief_complaint)
       VALUES (?, 's', 's', ?, 'doc-a', ?, ?, ?, 'Pain')`,
      id,
      patient,
      day,
      status,
      note,
    );
  visit("v-now", P, "2026-11-25", "draft", null);
  for (let i = 1; i <= 5; i++) visit(`v-old${i}`, P, `2026-10-0${i}`, "final", `Exam ${i}`);
  visit("v-void", P, "2026-11-20", "void", "voided");
  visit("v-other", OTHER, "2026-11-01", "final", "not mine");

  run(
    `INSERT INTO plan_items (id, created_by, updated_by, patient_id, tooth_fdi, procedure_label, estimate_paise, status)
     VALUES ('pi-open', 's', 's', ?, 46, 'RCT', 500000, 'in_progress'),
            ('pi-done', 's', 's', ?, 11, 'Filling', 100000, 'completed')`,
    P,
    P,
  );
  run(
    `INSERT INTO appointments (id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
       start_at, date_local, start_min, end_min, status, source)
     VALUES ('a-next', 's', 's', ?, '1', 'vt', 'Follow-up', '2099-01-02T05:00:00.000Z', '2099-01-02', 600, 630, 'scheduled', 'phone')`,
    P,
  );
  run(
    `INSERT INTO bills (id, created_by, updated_by, patient_id, bill_on, status, total_paise)
     VALUES ('b1', 's', 's', ?, '2026-10-01', 'issued', 300000)`,
    P,
  );
  run(
    `INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local)
     VALUES ('pay1', 's', 's', ?, 100000, 'cash', '2026-10-01T05:00:00.000Z', 'doc-a', '2026-10-01')`,
    P,
  );
  run(
    `INSERT INTO payment_allocations (id, created_by, updated_by, payment_id, bill_id, amount_paise)
     VALUES ('al1', 's', 's', 'pay1', 'b1', 100000)`,
  );
  run(
    `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, original_filename, tooth_fdi)
     VALUES ('f1', 's', 's', ?, 'k1', 'iopa', 'image/jpeg', 10, ?, 'xray.jpg', 36)`,
    P,
    "a".repeat(64),
  );
  run(
    `INSERT INTO prescriptions (id, created_by, updated_by, patient_id, doctor_id, status, rx_no, issued_at)
     VALUES ('rx1', 's', 's', ?, 'doc-a', 'issued', 'RX-1', '2026-10-01T05:00:00.000Z'),
            ('rx2', 's', 's', ?, 'doc-a', 'issued', 'RX-2', '2026-10-05T05:00:00.000Z'),
            ('rx3', 's', 's', ?, 'doc-a', 'draft', NULL, NULL)`,
    P,
    P,
    P,
  );
  const item = (id: string, rx: string, name: string, order: number) =>
    run(
      `INSERT INTO prescription_items (id, created_by, updated_by, prescription_id, generic_name, form, dose, frequency, days, timing, sort_order)
       VALUES (?, 's', 's', ?, ?, 'tablet', '1', '1-0-1', '5', 'after food', ?)`,
      id,
      rx,
      name,
      order,
    );
  item("i1", "rx1", "Old medicine", 1);
  item("i2", "rx2", "Amoxicillin", 1);
  item("i3", "rx2", "Ibuprofen", 2);
  item("i4", "rx3", "Draft medicine", 1);
}

describe("visit page read (B5)", () => {
  it("returns the visit and everything around it", async () => {
    const t = countingDb();
    seed(t.sqlite);
    const repos = createRepos(t.db, doctor);
    await repos.visitDiagnoses.add({ visitId: "v-now", freeText: "Pulpitis", toothFdi: 46 });
    const page = await repos.visitPage.get("v-now", new Date("2026-11-25T05:00:00.000Z"));

    expect(page.visit).toMatchObject({ id: "v-now", status: "draft", noDiagnosis: false });
    expect(page.visit.diagnoses.map((d) => d.label)).toEqual(["Pulpitis"]);
    expect(page.openPlanItems.map((p) => p.id)).toEqual(["pi-open"]);
    expect(page.lastVisits.map((v) => v.id)).toEqual(["v-old5", "v-old4", "v-old3"]);
    expect(page.lastVisits[0]?.examNote).toBe("Exam 5");
    expect(page.nextAppointment).toMatchObject({ id: "a-next", dateLocal: "2099-01-02" });
    expect(page.duesPaise).toBe(200000);
    expect(page.files.map((f) => f.originalFilename)).toEqual(["xray.jpg"]);
    expect(page.previousMedicines).toMatchObject({ rxNo: "RX-2" });
    expect(page.previousMedicines?.items.map((i) => i.genericName)).toEqual([
      "Amoxicillin",
      "Ibuprofen",
    ]);
  });

  it("is two round trips and 10 queries at most (PLAN Part S)", async () => {
    const t = countingDb();
    seed(t.sqlite);
    const repos = createRepos(t.db, doctor);
    t.reset();
    await repos.visitPage.get("v-now");
    const c = t.counts();
    expect(c.batches).toBe(1);
    expect(c.roundTrips).toBe(2);
    expect(c.statements).toBeLessThanOrEqual(10);
  });

  it("uses indexes for every statement (no full table scan)", async () => {
    const t = recordingDb();
    seed(t.sqlite);
    await createRepos(t.db, doctor).visitPage.get("v-now");
    expect(t.ran.length).toBeGreaterThanOrEqual(10);
    // refunded and ral are CTEs of the dues query, already cut down to this one patient.
    const scans = scansIn(t.sqlite, t.ran)
      .map((l) => l.split("  <-")[0] as string)
      .filter((l) => !/^SCAN (refunded|ral|taken|paid_by_bill|taken_by_bill|open_bills)$/.test(l));
    expect(scans).toEqual([]);
  });

  it("gives an empty page for a patient with no history", async () => {
    const t = countingDb();
    seed(t.sqlite);
    const repos = createRepos(t.db, doctor);
    t.sqlite
      .prepare(
        `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
         VALUES ('v-solo', 's', 's', ?, 'doc-a', '2026-11-25', 'draft')`,
      )
      .run(OTHER);
    t.sqlite.prepare("DELETE FROM visits WHERE id = 'v-other'").run();
    const page = await repos.visitPage.get("v-solo");
    expect(page).toMatchObject({
      openPlanItems: [],
      lastVisits: [],
      nextAppointment: null,
      duesPaise: 0,
      files: [],
      previousMedicines: null,
    });
  });

  it("dues give the same answer as the long way, also after a refund", async () => {
    const t = countingDb();
    seed(t.sqlite);
    const repos = createRepos(t.db, doctor);
    t.sqlite
      .prepare(
        `INSERT INTO refunds (id, created_by, updated_by, payment_id, patient_id, amount_paise, mode, reason, approved_by, approved_at)
         VALUES ('rf1', 's', 's', 'pay1', ?, 30000, 'cash', 'Test', 'doc-a', '2026-10-02T05:00:00.000Z')`,
      )
      .run(P);
    const slow = (await openBillDues(t.db, P)).reduce((n, d) => n + d.duePaise, 0);
    expect(slow).toBe(230000);
    expect((await repos.visitPage.get("v-now")).duesPaise).toBe(slow);
  });

  it("refuses a receptionist and an unknown visit", async () => {
    const t = countingDb();
    seed(t.sqlite);
    await expect(createRepos(t.db, receptionist).visitPage.get("v-now")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(createRepos(t.db, doctor).visitPage.get("nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

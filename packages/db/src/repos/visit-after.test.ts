import { describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { countingDb, recordingDb, scansIn } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const NOW = new Date("2026-11-25T05:00:00.000Z");

type Sqlite = ReturnType<typeof countingDb>["sqlite"];

function seed(sqlite: Sqlite) {
  const run = (sql: string, ...a: (string | number | null)[]) => sqlite.prepare(sql).run(...a);
  run(
    `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
     VALUES ('p1', 's', 's', 'P-009993', 'Fake After Patient', 'female', 30, '+919900099931', 'active')`,
  );
  run(
    `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status, created_at)
     VALUES ('v-old', 's', 's', 'p1', 'doc-a', '2026-10-01', 'final', '2026-10-01T05:00:00.000Z'),
            ('v-now', 's', 's', 'p1', 'doc-a', '2026-11-25', 'final', '2026-11-25T03:00:00.000Z')`,
  );
  run(
    `INSERT INTO visit_diagnoses (id, created_by, updated_by, visit_id, label, tooth_fdi) VALUES ('d1', 's', 's', 'v-now', 'Pulpitis', 46)`,
  );
  run(
    `INSERT INTO visit_procedures (id, created_by, updated_by, visit_id, label, tooth_fdi, surfaces_json, default_paise)
     VALUES ('pr1', 's', 's', 'v-now', 'RCT sitting 1', 46, '["o"]', 500000)`,
  );
  run(
    `INSERT INTO plan_items (id, created_by, updated_by, patient_id, tooth_fdi, procedure_label, estimate_paise, status, sittings)
     VALUES ('pi1', 's', 's', 'p1', 46, 'RCT', 500000, 'in_progress', 3)`,
  );
  run(
    `INSERT INTO appointments (id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
       start_at, date_local, start_min, end_min, status, source)
     VALUES ('a1', 's', 's', 'p1', '1', 'vt', 'RCT sitting 2', '2099-01-02T05:00:00.000Z', '2099-01-02', 600, 630, 'scheduled', 'phone')`,
  );
  run(
    `INSERT INTO prescriptions (id, created_by, updated_by, patient_id, visit_id, doctor_id, status, rx_no, issued_at, follow_up_on)
     VALUES ('rx1', 's', 's', 'p1', 'v-now', 'doc-a', 'issued', 'RX-1', '2026-11-25T04:00:00.000Z', '2026-12-02')`,
  );
  const file = (id: string, at: string) =>
    run(
      `INSERT INTO files (id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256, original_filename, tooth_fdi, created_at)
       VALUES (?, 's', 's', 'p1', ?, 'iopa', 'image/jpeg', 10, ?, ?, 46, ?)`,
      id,
      `k-${id}`,
      "a".repeat(64),
      `${id}.jpg`,
      at,
    );
  file("f-old", "2026-10-02T05:00:00.000Z");
  file("f-new", "2026-11-25T03:30:00.000Z");
  // An older bill with 2,000 still due, 5,000 total, 3,000 paid.
  run(
    `INSERT INTO bills (id, created_by, updated_by, patient_id, visit_id, bill_on, status, total_paise, subtotal_paise)
     VALUES ('b-old', 's', 's', 'p1', 'v-old', '2026-10-01', 'issued', 500000, 500000)`,
  );
  run(
    `INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local)
     VALUES ('pay1', 's', 's', 'p1', 300000, 'cash', '2026-10-01T05:00:00.000Z', 'doc-a', '2026-10-01')`,
  );
  run(
    `INSERT INTO payment_allocations (id, created_by, updated_by, payment_id, bill_id, amount_paise)
     VALUES ('al1', 's', 's', 'pay1', 'b-old', 300000)`,
  );
}

const bill = (sqlite: Sqlite, status: string, total: number, paid: number) => {
  sqlite
    .prepare(
      `INSERT INTO bills (id, created_by, updated_by, patient_id, visit_id, bill_on, status, total_paise, subtotal_paise, bill_no, notes)
       VALUES ('b-now', 's', 's', 'p1', 'v-now', '2026-11-25', ?, ?, ?, ?, 'Pays Friday')`,
    )
    .run(status, total, total, status === "issued" ? "SB-2026-27-0001" : null);
  if (paid > 0) {
    sqlite
      .prepare(
        `INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local)
         VALUES ('pay2', 's', 's', 'p1', ?, 'upi', '2026-11-25T05:00:00.000Z', 'doc-a', '2026-11-25')`,
      )
      .run(paid);
    sqlite
      .prepare(
        `INSERT INTO payment_allocations (id, created_by, updated_by, payment_id, bill_id, amount_paise)
         VALUES ('al2', 's', 's', 'pay2', 'b-now', ?)`,
      )
      .run(paid);
  }
};

describe("visit after read (handoff section 13)", () => {
  it("names today's details without fees, the follow-up, new files, earlier dues and no bill yet", async () => {
    const t = countingDb();
    seed(t.sqlite);
    const after = await createRepos(t.db, doctor).visitAfter.get("v-now", NOW);
    expect(after.diagnoses).toEqual([{ id: "d1", label: "Pulpitis", toothFdi: 46 }]);
    expect(after.procedures).toEqual([
      { id: "pr1", label: "RCT sitting 1", toothFdi: 46, surfaces: ["o"] },
    ]);
    expect(JSON.stringify(after.procedures)).not.toContain("500000");
    expect(after.nextAppointment).toMatchObject({ id: "a1", visitTypeLabel: "RCT sitting 2" });
    expect(after.openPlanItems).toEqual([
      expect.objectContaining({ id: "pi1", sittings: 3, sittingsDone: 0 }),
    ]);
    expect(after.followUpOn).toBe("2026-12-02");
    expect(after.filesAdded.map((f) => f.id)).toEqual(["f-new"]);
    expect(after.earlierDuesPaise).toBe(200000);
    expect(after.bill).toBeNull();
    expect(after.billState).toBe("not_billed");
  });

  it("P1/P7: the bill state follows the bill: draft, with reception, paid", async () => {
    const asState = async (setup: (s: Sqlite) => void) => {
      const t = countingDb();
      seed(t.sqlite);
      setup(t.sqlite);
      return createRepos(t.db, doctor).visitAfter.get("v-now", NOW);
    };
    const draft = await asState((s) => bill(s, "draft", 120000, 0));
    expect(draft).toMatchObject({ billState: "draft", bill: { paidPaise: 0, duePaise: 120000 } });
    expect(draft.bill?.billNo).toBeNull();

    const open = await asState((s) => bill(s, "issued", 120000, 20000));
    expect(open).toMatchObject({
      billState: "with_reception",
      bill: { billNo: "SB-2026-27-0001", paidPaise: 20000, duePaise: 100000, notes: "Pays Friday" },
    });
    expect(open.earlierDuesPaise).toBe(200000);

    const paid = await asState((s) => bill(s, "issued", 120000, 120000));
    expect(paid).toMatchObject({ billState: "paid", bill: { duePaise: 0, paidPaise: 120000 } });
  });

  it("paid at arrival: unused payments of the visit day, with what for and who; the usual fee", async () => {
    const t = countingDb();
    seed(t.sqlite);
    t.sqlite.exec(
      `INSERT INTO users (id, created_by, updated_by, email, name, role, status)
         VALUES ('rec-x', 's', 's', 'rec-x@example.test', 'Priya Desk', 'receptionist', 'active');
       INSERT INTO payments (id, created_by, updated_by, patient_id, amount_paise, mode, reference, notes, received_at, received_by, day_local)
         VALUES ('pa1', 's', 's', 'p1', 50000, 'cash', '', 'For: Consultation', '2026-11-25T04:35:00.000Z', 'rec-x', '2026-11-25'),
                ('pa2', 's', 's', 'p1', 50000, 'upi', '1234', 'For: X-ray', '2026-11-25T04:36:00.000Z', 'rec-x', '2026-11-25');
       UPDATE settings SET value_json = '50000' WHERE key = 'billing.consultation_fee_paise';
       UPDATE visits SET finalised_at = '2026-11-25T06:10:00.000Z' WHERE id = 'v-now';`,
    );
    const after = await createRepos(t.db, doctor).visitAfter.get("v-now", NOW);
    expect(after.arrival.totalPaise).toBe(100000);
    expect(after.arrival.items.map((i) => [i.notes, i.mode, i.receivedByName])).toEqual([
      ["For: Consultation", "cash", "Priya Desk"],
      ["For: X-ray", "upi", "Priya Desk"],
    ]);
    expect(after.consultationFeePaise).toBe(50000);
    expect(after.visit).toMatchObject({
      doctorId: "doc-a",
      finalisedAt: "2026-11-25T06:10:00.000Z",
    });
  });

  it("a cancelled bill does not count", async () => {
    const t = countingDb();
    seed(t.sqlite);
    bill(t.sqlite, "cancelled", 120000, 0);
    const after = await createRepos(t.db, doctor).visitAfter.get("v-now", NOW);
    expect(after).toMatchObject({ bill: null, billState: "not_billed" });
  });

  it("is two round trips and at most 10 queries", async () => {
    const t = countingDb();
    seed(t.sqlite);
    bill(t.sqlite, "issued", 120000, 0);
    const repos = createRepos(t.db, doctor);
    t.reset();
    await repos.visitAfter.get("v-now", NOW);
    const c = t.counts();
    expect(c).toMatchObject({ batches: 1, roundTrips: 2 });
    // 9 + the "paid at arrival" read (visit finished plan P1.2.3): the limit of about 10.
    expect(c.statements).toBeLessThanOrEqual(10);
  });

  it("uses an index for every statement", async () => {
    const t = recordingDb();
    seed(t.sqlite);
    bill(t.sqlite, "issued", 120000, 0);
    await createRepos(t.db, doctor).visitAfter.get("v-now", NOW);
    expect(t.ran.length).toBeGreaterThanOrEqual(9);
    const scans = scansIn(t.sqlite, t.ran)
      .map((l) => l.split("  <-")[0] as string)
      .filter((l) => !/^SCAN (refunded|ral|taken|paid_by_bill|taken_by_bill|open_bills)$/.test(l));
    expect(scans).toEqual([]);
  });

  it("P11: a receptionist is refused; an unknown visit is not found", async () => {
    const t = countingDb();
    seed(t.sqlite);
    await expect(createRepos(t.db, receptionist).visitAfter.get("v-now")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(createRepos(t.db, doctor).visitAfter.get("nope")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

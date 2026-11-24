import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { queryPlan, recordingDb, scansIn } from "../testing";
import { createRepos } from "./index";

// S3.2.2: the week list is one date_local range query that reaches appointments through an index.
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r1" };

let t: ReturnType<typeof recordingDb>;

function addAppointment(id: string, patientId: string, dateLocal: string, startMin: number) {
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES (?, 'system', 'system', ?, '1', 'vt1', 'Consultation',
         ?, ?, ?, ?, 'scheduled', 'phone', 'normal', 0)`,
    )
    .run(id, patientId, `${dateLocal}T05:00:00.000Z`, dateLocal, startMin, startMin + 30);
}

beforeEach(() => {
  t = recordingDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
});

describe("appointments listForRange (S3.2.2)", () => {
  it("returns only the days asked for, oldest day first, then by time", async () => {
    addAppointment("a-late", "p1", "2026-12-08", 700);
    addAppointment("a-early", "p1", "2026-12-08", 600);
    addAppointment("a-first", "p1", "2026-12-07", 900);
    addAppointment("a-before", "p1", "2026-12-06", 600);
    addAppointment("a-after", "p1", "2026-12-14", 600);
    const rows = await createRepos(t.db, receptionist).appointments.listForRange(
      "2026-12-07",
      "2026-12-13",
    );
    expect(rows.map((r) => r.id)).toEqual(["a-first", "a-early", "a-late"]);
  });

  it("hides a deleted appointment", async () => {
    addAppointment("a1", "p1", "2026-12-07", 600);
    t.sqlite.prepare("UPDATE appointments SET deleted_at = '2026-12-01T00:00:00.000Z'").run();
    const rows = await createRepos(t.db, receptionist).appointments.listForRange(
      "2026-12-07",
      "2026-12-13",
    );
    expect(rows).toEqual([]);
  });

  it("EXPLAIN QUERY PLAN: appointments are reached by the date index, no full scan", async () => {
    await createRepos(t.db, receptionist).appointments.listForRange("2026-12-07", "2026-12-13");
    const ran = t.ran.filter((r) => /from "appointments"/i.test(r.sql));
    expect(ran.length).toBe(1);
    expect(scansIn(t.sqlite, ran)).toEqual([]);
    const plan = queryPlan(t.sqlite, ran[0]!.sql, ran[0]!.params);
    expect(
      plan.some((l) =>
        /appointments_(day_status|day_queue|chair_day_start|patient_day)_idx/i.test(l),
      ),
    ).toBe(true);
    // Shown on purpose: this is the plan the owner asked to see.
    expect(plan.join("\n")).toMatch(/SEARCH appointments USING (COVERING )?INDEX/i);
  });
});

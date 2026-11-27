import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const desk: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

beforeEach(() => {
  t = testDb();
  t.sqlite.exec(`
    INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
      VALUES ('p1', 's', 's', 'P-009981', 'Fake Desk Print', 'male', 40, '+919900099811', 'active');
    INSERT INTO appointments (id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
        start_at, date_local, start_min, end_min, status, source)
      VALUES ('a1', 's', 's', 'p1', '1', 'vt', 'Check', '2026-11-27T05:00:00.000Z', '2026-11-27', 600, 630, 'completed', 'walk_in');
    INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, appointment_id, visit_date_local, status)
      VALUES ('v1', 's', 's', 'p1', 'doc-a', 'a1', '2026-11-27', 'final');
    INSERT INTO prescriptions (id, created_by, updated_by, patient_id, visit_id, doctor_id, status, rx_no, issued_at)
      VALUES ('rx1', 's', 's', 'p1', 'v1', 'doc-a', 'issued', 'RX-2026-27-0001', '2026-11-27T05:30:00.000Z'),
             ('rx-draft', 's', 's', 'p1', NULL, 'doc-a', 'draft', NULL, NULL);
  `);
});

describe("prescription passed to the desk (visit finished P1.3.2)", () => {
  it("the doctor asks, the desk sees it until it prints; the prescription row is not touched", async () => {
    const before = t.sqlite.prepare(`SELECT version FROM prescriptions WHERE id = 'rx1'`).get();
    const first = await repos().rxDeskPrint.requestDeskPrint("rx1");
    const again = await repos().rxDeskPrint.requestDeskPrint("rx1");
    expect(again.requestedAt).toBe(first.requestedAt);

    const waiting = (await repos(desk).bills.deskMarks(["a1"])).rxToPrint;
    expect(waiting.get("a1")).toMatchObject({ prescriptionId: "rx1", rxNo: "RX-2026-27-0001" });

    const printed = await repos(desk).printLog.record({
      documentKind: "prescription",
      documentId: "rx1",
    });
    expect(printed.isReprint).toBe(false); // the request is not a print
    expect((await repos(desk).bills.deskMarks(["a1"])).rxToPrint.size).toBe(0);
    expect(t.sqlite.prepare(`SELECT version FROM prescriptions WHERE id = 'rx1'`).get()).toEqual(
      before,
    );
  });

  it("a draft is refused; the desk cannot ask", async () => {
    await expect(repos().rxDeskPrint.requestDeskPrint("rx-draft")).rejects.toBeInstanceOf(
      InvalidError,
    );
    await expect(repos(desk).rxDeskPrint.requestDeskPrint("rx1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTMEDHIST0001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009905', 'Fake Med Patient', 'female', 40, '+919900001444', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("medical history (3.2.4)", () => {
  it("creates a new version without overwriting the old answers", async () => {
    const v1 = await repos().medicalHistory.save({
      patientId: PATIENT_ID,
      items: [
        {
          code: "diabetes",
          label: "Diabetes",
          answer: "yes",
          alertLabel: "Diabetes",
          restricted: false,
        },
      ],
    });
    expect(v1.versionNo).toBe(1);

    const v2 = await repos().medicalHistory.save({
      patientId: PATIENT_ID,
      items: [
        {
          code: "diabetes",
          label: "Diabetes",
          answer: "no",
        },
        {
          code: "hiv",
          label: "HIV",
          answer: "yes",
          alertLabel: "Doctor to check",
          restricted: true,
        },
      ],
    });
    expect(v2.versionNo).toBe(2);

    const rows = t.sqlite
      .prepare(
        `SELECT version_no, answers_json FROM medical_history WHERE patient_id = ? ORDER BY version_no`,
      )
      .all(PATIENT_ID) as { version_no: number; answers_json: string }[];
    expect(rows).toHaveLength(2);
    expect(JSON.parse(rows[0]!.answers_json)[0].answer).toBe("yes");
    expect(JSON.parse(rows[1]!.answers_json)[0].answer).toBe("no");

    const latest = await repos().medicalHistory.latest(PATIENT_ID);
    expect(latest?.versionNo).toBe(2);

    const doctorAlerts = await repos().medicalHistory.listAlerts(PATIENT_ID);
    expect(doctorAlerts).toEqual([
      expect.objectContaining({ code: "hiv", restricted: true, active: true }),
    ]);
  });

  it("receptionist gets flags only, not alert details", async () => {
    await repos().medicalHistory.save({
      patientId: PATIENT_ID,
      items: [
        {
          code: "hiv",
          label: "HIV",
          answer: "yes",
          alertLabel: "Restricted detail",
          restricted: true,
        },
      ],
    });
    await expect(repos(receptionist).medicalHistory.listAlerts(PATIENT_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos(receptionist).medicalHistory.latest(PATIENT_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    const flags = await repos(receptionist).medicalHistory.alertFlags(PATIENT_ID);
    expect(flags).toEqual({ hasAlert: true, hasRestricted: true });
  });
});

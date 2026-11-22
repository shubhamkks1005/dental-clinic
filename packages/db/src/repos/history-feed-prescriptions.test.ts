import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTRX000001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009950', 'Fake Hist Rx', 'male', 35, '+919900001188', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history feed prescriptions (4.2.8)", () => {
  it("lists issued Rx for doctor with medicines; receptionist gets rx number only", async () => {
    const draft = await repos(doctor).prescriptions.create({
      patientId: PATIENT_ID,
      advice: "",
      dentistDispensed: false,
      dentistDispensedNote: "",
      items: [
        {
          genericName: "Amoxicillin",
          brand: "",
          form: "Cap",
          strength: "500 mg",
          dose: "1",
          frequency: "1-0-1",
          days: "5",
          timing: "after_food",
          instruction: "",
          tags: "penicillin",
        },
      ],
    });
    const issued = await repos(doctor).prescriptions.issue(draft.id, draft.version);

    const docPage = await repos(doctor).history.listFeed(PATIENT_ID, { limit: 20 });
    const docRx = docPage.entries.find((e) => e.type === "prescription");
    expect(docRx?.summary).toContain("Amoxicillin");
    expect(docRx?.href).toContain(`/print/prescription/${issued.id}`);

    const recPage = await repos(receptionist).history.listFeed(PATIENT_ID, { limit: 20 });
    const recRx = recPage.entries.find((e) => e.type === "prescription");
    expect(recRx).toBeDefined();
    expect(recRx?.summary).not.toMatch(/Amoxicillin/i);
    expect(recRx?.summary).toContain(issued.rxNo!);
  });
});

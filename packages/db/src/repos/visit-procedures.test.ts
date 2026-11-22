import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTPROCTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009913', 'Fake Proc Patient', 'male', 40, '+919900001144', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visit procedures (3.5.4)", () => {
  it("adds a list procedure with tooth and surfaces; receptionist forbidden", async () => {
    const listed = await repos().lists.add("procedures", {
      label: "Temp filling (test)",
      data: { default_paise: 150000, code: "TEMP" },
    });
    const item = listed.find((i) => i.label === "Temp filling (test)");
    expect(item).toBeDefined();

    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-23",
    });
    const row = await repos().visitProcedures.add({
      visitId: visit.id,
      listItemId: item!.id,
      toothFdi: 46,
      surfaces: ["o", "m"],
      note: "Shade A2",
    });
    expect(row.label).toBe("Temp filling (test)");
    expect(row.defaultPaise).toBe(150000);
    expect(row.surfaces).toEqual(["o", "m"]);

    const onVisit = await repos().visitProcedures.listForVisit(visit.id);
    expect(onVisit).toHaveLength(1);

    await expect(
      repos(receptionist).visitProcedures.add({
        visitId: visit.id,
        listItemId: item!.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await repos().visits.finalise(visit.id, { version: visit.version });
    await expect(
      repos().visitProcedures.add({ visitId: visit.id, listItemId: item!.id }),
    ).rejects.toBeInstanceOf(InvalidError);
  });
});

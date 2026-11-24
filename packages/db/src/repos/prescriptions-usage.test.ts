import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const PATIENT_ID = "01M83PATIENTUSE000001";

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const item = (genericName: string) => ({
  genericName,
  brand: "",
  form: "Tab",
  strength: "",
  dose: "1",
  frequency: "1-0-1",
  days: "3",
  timing: "after_food",
  instruction: "",
  tags: "",
});
const rx = (names: string[]) =>
  repos().prescriptions.create({
    patientId: PATIENT_ID,
    advice: "",
    dentistDispensed: false,
    dentistDispensedNote: "",
    items: names.map(item),
  });

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009921', 'Fake Usage Patient', 'female', 28, '+919900001166', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("medicine usage, last 30 days (Q2.13)", () => {
  it("counts issued prescriptions per medicine, ignores drafts and old ones", async () => {
    const a = await rx(["Paracetamol", "Ibuprofen"]);
    await repos().prescriptions.issue(a.id, a.version);
    const b = await rx(["paracetamol"]);
    await repos().prescriptions.issue(b.id, b.version);
    await rx(["Ibuprofen"]); // draft: not counted
    const old = await rx(["Amoxicillin"]);
    await repos().prescriptions.issue(old.id, old.version);
    t.sqlite
      .prepare("UPDATE prescriptions SET created_at = '2020-01-01T00:00:00.000Z' WHERE id = ?")
      .run(old.id);
    expect(await repos().prescriptions.medicineUsage30d()).toEqual({
      paracetamol: 2,
      ibuprofen: 1,
    });
  });

  it("is doctor only", async () => {
    await expect(repos(receptionist).prescriptions.medicineUsage30d()).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

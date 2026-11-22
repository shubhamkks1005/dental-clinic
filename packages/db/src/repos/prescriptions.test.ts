import { medicineSnapshot } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTRXTEST00001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009920', 'Fake Rx Patient', 'female', 28, '+919900001155', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("prescriptions schema (4.2.1)", () => {
  it("stores a medicine name snapshot so later list edits do not rewrite the Rx", async () => {
    const listed = await repos().lists.add("medicines", {
      label: "Fake Rx Testcillin",
      data: {
        brand: "",
        form: "Cap",
        strength: "250 mg",
        default_dose: "1 cap",
        default_frequency: "1-0-1",
        default_days: "5",
        timing: "after_food",
        instruction: "Complete the course.",
        tags: "penicillin",
        category: "DRAFT - doctor to confirm",
      },
    });
    const med = listed.find((i) => i.label === "Fake Rx Testcillin")!;
    const snap = medicineSnapshot(med);

    const rx = await repos().prescriptions.create({
      patientId: PATIENT_ID,
      advice: "",
      dentistDispensed: false,
      dentistDispensedNote: "",
      items: [
        {
          medicineId: snap.medicineId,
          genericName: snap.genericName,
          brand: snap.brand,
          form: snap.form,
          strength: snap.strength,
          dose: snap.dose,
          frequency: snap.frequency,
          days: snap.days,
          timing: snap.timing,
          instruction: snap.instruction,
          tags: snap.tags,
        },
      ],
    });

    expect(rx.status).toBe("draft");
    expect(rx.items[0]?.genericName).toBe("Fake Rx Testcillin");

    await repos().lists.update(
      "medicines",
      med.id,
      {
        label: "Fake Rx Testcillin XL",
        data: { ...med.data, default_dose: "2 caps" },
      },
      med.version,
    );

    const again = await repos().prescriptions.get(rx.id);
    expect(again.items[0]?.genericName).toBe("Fake Rx Testcillin");
    expect(again.items[0]?.dose).toBe("1 cap");
  });

  it("forbids receptionist from creating or reading a draft", async () => {
    await expect(
      repos(receptionist).prescriptions.create({
        patientId: PATIENT_ID,
        advice: "",
        dentistDispensed: false,
        dentistDispensedNote: "",
        items: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const rx = await repos().prescriptions.create({
      patientId: PATIENT_ID,
      advice: "",
      dentistDispensed: false,
      dentistDispensedNote: "",
      items: [],
    });
    await expect(repos(receptionist).prescriptions.get(rx.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

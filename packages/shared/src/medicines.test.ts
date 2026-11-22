import { describe, expect, it } from "vitest";
import {
  medicineMatchesAllergen,
  medicineSnapshot,
  parseMedicineSetItems,
  parseMedicineTags,
} from "./medicines";

describe("medicine snapshot (4.1.3)", () => {
  it("keeps the old name after the master list label changes", () => {
    const item = {
      id: "med-1",
      label: "Amoxicillin",
      data: {
        brand: "",
        form: "Cap",
        strength: "500 mg",
        default_dose: "1 cap",
        default_frequency: "1-0-1",
        default_days: "5",
        timing: "after_food",
        instruction: "Complete the course.",
        tags: "penicillin",
        category: "DRAFT - doctor to confirm",
      },
    };
    const snap = medicineSnapshot(item);
    expect(snap.genericName).toBe("Amoxicillin");
    expect(snap.dose).toBe("1 cap");
    item.label = "Amoxicillin trihydrate";
    item.data.default_dose = "2 caps";
    expect(snap.genericName).toBe("Amoxicillin");
    expect(snap.dose).toBe("1 cap");
  });
});

describe("medicine tags and sets (4.1.4 / 4.1.5)", () => {
  it("parses space or comma tags", () => {
    expect(parseMedicineTags("penicillin nsaid")).toEqual(["penicillin", "nsaid"]);
    expect(parseMedicineTags("penicillin, NSAID")).toEqual(["penicillin", "nsaid"]);
  });

  it("matches Penicillin allergen to penicillin-tagged medicine", () => {
    expect(medicineMatchesAllergen("penicillin", "penicillin")).toBe(true);
    expect(medicineMatchesAllergen("penicillin", "Penicillin")).toBe(true);
    expect(medicineMatchesAllergen("nsaid", "penicillin")).toBe(false);
    expect(medicineMatchesAllergen("", "penicillin")).toBe(false);
  });

  it("parses set items by pipe", () => {
    expect(parseMedicineSetItems("Amoxicillin|Metronidazole|Ibuprofen")).toEqual([
      "Amoxicillin",
      "Metronidazole",
      "Ibuprofen",
    ]);
  });
});

import type { ListItem } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { linesOfSet } from "./rx-lines";

const med = (id: string, label: string, active = true): ListItem => ({
  id,
  label,
  data: {
    strength: "500 mg",
    default_dose: "1 tab",
    default_frequency: "1-0-1",
    default_days: "5",
  },
  active,
  sortOrder: 1,
  version: 1,
});
const set = (data: Record<string, string>): ListItem => ({
  id: "s1",
  label: "After extraction",
  data,
  active: true,
  sortOrder: 1,
  version: 1,
});

describe("medicine set to prescription lines (L12, Q6, Q12)", () => {
  const meds = [med("m1", "Amoxicillin"), med("m2", "Ibuprofen"), med("m3", "Paracetamol")];

  it("a set of 3 gives 3 lines at once, in the set's order, by id", () => {
    const lines = linesOfSet(set({ items: "x|y|z", item_ids: "m3|m1|m2" }), meds, 7);
    expect(lines.map((l) => [l.medicineId, l.genericName, l.dose])).toEqual([
      ["m3", "Paracetamol", "1 tab"],
      ["m1", "Amoxicillin", "1 tab"],
      ["m2", "Ibuprofen", "1 tab"],
    ]);
    expect(new Set(lines.map((l) => l.key)).size).toBe(3);
  });

  it("an older set without ids matches active medicines by name", () => {
    expect(
      linesOfSet(set({ items: "ibuprofen|Amoxicillin" }), meds, 1).map((l) => l.medicineId),
    ).toEqual(["m2", "m1"]);
  });

  it("a set with a hidden or missing medicine adds nothing (not offered)", () => {
    const withHidden = [...meds.slice(0, 2), med("m3", "Paracetamol", false)];
    expect(linesOfSet(set({ items: "a|b", item_ids: "m1|m3" }), withHidden, 1)).toEqual([]);
    expect(linesOfSet(set({ items: "a|b", item_ids: "m1|gone" }), meds, 1)).toEqual([]);
  });
});

import type { ListItem } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { columnsFor, countFilters, filterItems, needsReview } from "./library-view";

const med = (label: string, over: Partial<ListItem> = {}, reviewed = ""): ListItem => ({
  id: label,
  label,
  data: {
    form: "Tablet",
    strength: "400 mg",
    default_dose: "As directed",
    default_frequency: "1-0-1",
    reviewed,
  },
  active: true,
  sortOrder: 0,
  version: 1,
  ...over,
});

describe("Library view rules", () => {
  const items = [med("Ibuprofen"), med("Amoxicillin", {}, "yes"), med("Old", { active: false })];
  it("needs review = a medicine not added or saved by the doctor in the Library", () => {
    expect(needsReview("medicines", items[0]!)).toBe(true);
    expect(needsReview("medicines", items[1]!)).toBe(false);
    expect(needsReview("procedures", items[0]!)).toBe(false);
  });
  it("counts and filters (hidden items never count as needing review)", () => {
    expect(countFilters("medicines", items)).toEqual({ all: 3, review: 1, hidden: 1 });
    expect(filterItems("medicines", items, "review", "").map((i) => i.label)).toEqual([
      "Ibuprofen",
    ]);
    expect(filterItems("medicines", items, "hidden", "").map((i) => i.label)).toEqual(["Old"]);
    expect(filterItems("medicines", items, "all", "amox").map((i) => i.label)).toEqual([
      "Amoxicillin",
    ]);
  });
  it("shows the fee in rupees for procedures and minutes for visit types", () => {
    const proc: ListItem = { ...med("Scaling"), data: { default_paise: 150000, code: "SC" } };
    expect(columnsFor("procedures").map((c) => c.cell(proc))).toEqual(["₹1,500", "SC"]);
    const vt: ListItem = { ...med("Consultation"), data: { minutes: 20, color: "#1E4FA3" } };
    expect(columnsFor("visit_types")[0]!.cell(vt)).toBe("20 minutes");
  });
  it("shows the used count only when it is known", () => {
    const used = columnsFor("medicines")[2]!;
    expect(used.cell(items[0]!, 4)).toBe("4");
    expect(used.cell(items[0]!)).toBe("-");
  });
});

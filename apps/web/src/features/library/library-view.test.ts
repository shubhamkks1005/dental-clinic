import type { ListItem } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { draftFrom, toInput } from "./library-draft";
import {
  countViews,
  filterChoices,
  filterItems,
  medicineLine,
  movedBy,
  movedTo,
  NO_MORE_FILTERS,
  rupeesToPaise,
  sortItems,
  twinLabels,
} from "./library-view";

const med = (
  id: string,
  label: string,
  data: Record<string, string> = {},
  active = true,
): ListItem => ({
  id,
  label,
  data: { reviewed: "yes", ...data },
  active,
  sortOrder: Number(id.replace(/\D/g, "")) || 1,
  version: 1,
  createdByName: "Dr Fake",
});

const list = [
  med("m1", "Amoxicillin", { salt: "Amoxycillin trihydrate", brand: "Mox", form: "Cap" }),
  med("m2", "Ibuprofen", { form: "Tablet", category: "Analgesic", reviewed: "" }),
  med("m3", "Paracetamol", { form: "Tab", combination: "yes" }, false),
];

describe("Library filters (P5.3)", () => {
  it("counts active, needs review, hidden", () => {
    expect(countViews("medicines", list)).toEqual({ active: 2, review: 1, hidden: 1 });
  });
  it("search by name, salt and brand ('amox' finds by salt and brand)", () => {
    const ids = (q: string) => filterItems("medicines", list, "all", q).map((i) => i.id);
    expect(ids("trihydrate")).toEqual(["m1"]);
    expect(ids("mox")).toEqual(["m1"]);
    expect(ids("ibu")).toEqual(["m2"]);
  });
  it("views: all = active, review, hidden", () => {
    expect(filterItems("medicines", list, "review", "").map((i) => i.id)).toEqual(["m2"]);
    expect(filterItems("medicines", list, "hidden", "").map((i) => i.id)).toEqual(["m3"]);
  });
  it("Tab and Tablet are one dosage form (L15)", () => {
    const all = [...list, med("m4", "Cetirizine", { form: "Tab" })];
    const more = { ...NO_MORE_FILTERS, form: "tablet" };
    expect(filterItems("medicines", all, "all", "", more).map((i) => i.id)).toEqual(["m2", "m4"]);
    expect(filterChoices(all).forms).toEqual([
      { key: "capsule", word: "Capsule" },
      { key: "tablet", word: "Tablet" },
    ]);
  });
  it("combination and category filters", () => {
    const yes = { ...NO_MORE_FILTERS, combination: "yes" as const };
    expect(filterItems("medicines", list, "hidden", "", yes).map((i) => i.id)).toEqual(["m3"]);
    const cat = { ...NO_MORE_FILTERS, category: "analgesic" };
    expect(filterItems("medicines", list, "all", "", cat).map((i) => i.id)).toEqual(["m2"]);
  });
});

describe("order and sort (P5.8)", () => {
  it("A to Z and Z to A", () => {
    expect(sortItems(list, "za").map((i) => i.id)).toEqual(["m3", "m2", "m1"]);
  });
  it("moves among active items; hidden items keep their slot (L1)", () => {
    const items = [med("a1", "A"), med("h2", "H", {}, false), med("b3", "B"), med("c4", "C")];
    expect(movedBy(items, "b3", "up").map((i) => i.id)).toEqual(["b3", "h2", "a1", "c4"]);
    expect(movedTo(items, "a1", 3).map((i) => i.id)).toEqual(["b3", "h2", "c4", "a1"]);
  });
});

describe("card words (P5.4.3)", () => {
  it("medicine line leaves out blank parts and says the counter", () => {
    const usage = { amoxicillin: { total: 48, last30: 6 } };
    expect(medicineLine(med("x", "Amoxicillin", { strength: "500 mg" }), usage, false)).toBe(
      "500 mg | You wrote this 48 times (6 in the last 30 days)",
    );
    expect(medicineLine(med("x", "Zed"), null, false)).toBe("You wrote this - times");
  });
  it("twins are active items with the same name", () => {
    expect([...twinLabels([med("1", "A"), med("2", "a"), med("3", "B")])]).toEqual(["a"]);
  });
});

describe("form input (P5.5)", () => {
  it("fee in rupees becomes paise; 'abc' is refused", () => {
    expect(rupeesToPaise("₹1,500")).toBe(150000);
    expect(rupeesToPaise("abc")).toBeNull();
    const d = draftFrom("procedures");
    expect(
      toInput("procedures", { label: "Scaling", data: { ...d.data, default_paise: "1500" } }),
    ).toEqual({
      ok: true,
      input: { label: "Scaling", data: { default_paise: 150000, code: "" } },
    });
  });
  it("empty name and 81 characters are refused", () => {
    expect(toInput("diagnoses", { label: " ", data: {} })).toEqual({
      ok: false,
      problem: "Enter a name.",
    });
    expect(toInput("diagnoses", { label: "x".repeat(81), data: {} }).ok).toBe(false);
  });
  it("a medicine saved in the Library is reviewed; 'As directed' shows as empty", () => {
    const d = draftFrom("medicines", med("m", "Zed", { default_dose: "As directed" }));
    expect(d.data.default_dose).toBe("");
    const r = toInput("medicines", d);
    expect(r.ok && r.input.data.reviewed).toBe("yes");
  });
  it("a set needs a medicine", () => {
    expect(toInput("medicine_sets", { label: "S", data: { items: "" } })).toEqual({
      ok: false,
      problem: "A set needs at least one medicine.",
    });
  });
});

import { describe, expect, it } from "vitest";
import { suggest } from "./dental-suggestions";
import { canonicalListData, isSameListItem, visitColourName } from "./list-rules";
import { listItemSchema } from "./lists";
import {
  isSetUsable,
  parseSetItemIds,
  resolveSetMedicines,
  setDataFrom,
  setsUsingMedicine,
  withoutMedicine,
} from "./medicine-set";
import {
  AS_DIRECTED,
  categoryTint,
  fillAsDirected,
  foodTimingWord,
  MEDICINE_FORM_WORD,
  medicineFormKey,
} from "./medicines";

describe("Library medicine fields (P1.1)", () => {
  const schema = listItemSchema("medicines");

  it("medicine with only a name parses", () => {
    const r = schema.parse({ label: "Amoxicillin", data: {} });
    expect(r.data.form).toBe("");
    expect(r.data.strength).toBe("");
    expect(r.data.salt).toBe("");
    expect(r.data.combination).toBe("");
  });

  it("medicine with 41-char strength is refused", () => {
    expect(schema.safeParse({ label: "A", data: { strength: "x".repeat(41) } }).success).toBe(
      false,
    );
  });

  it("salt and combination are optional; combination 'maybe' is refused", () => {
    expect(
      schema.parse({ label: "A", data: { salt: "Amoxycillin", combination: "yes" } }).data,
    ).toMatchObject({ salt: "Amoxycillin", combination: "yes" });
    expect(schema.safeParse({ label: "A", data: { combination: "maybe" } }).success).toBe(false);
  });

  it("set with item_ids parses; items stay required", () => {
    const sets = listItemSchema("medicine_sets");
    expect(sets.parse({ label: "S", data: { items: "A|B", item_ids: "1|2" } }).data.item_ids).toBe(
      "1|2",
    );
    expect(sets.safeParse({ label: "S", data: { item_ids: "1" } }).success).toBe(false);
  });
});

describe("fillAsDirected (P1.1.3)", () => {
  it("fills only the four fields", () => {
    expect(fillAsDirected({ form: "", strength: "" })).toEqual({
      form: "",
      strength: "",
      default_dose: AS_DIRECTED,
      default_frequency: AS_DIRECTED,
      default_days: AS_DIRECTED,
      timing: AS_DIRECTED,
    });
  });
  it("keeps typed values", () => {
    expect(fillAsDirected({ default_dose: "1 tab", timing: "after_food" })).toMatchObject({
      default_dose: "1 tab",
      timing: "after_food",
      default_days: AS_DIRECTED,
    });
  });
  it("blank form stays blank, no category invented", () => {
    const out = fillAsDirected({ form: "  " });
    expect(out.form).toBe("  ");
    expect(out.category).toBeUndefined();
  });
});

describe("words and keys (P1.1.6 - P1.1.9)", () => {
  it("food timing words", () => {
    expect(foodTimingWord("after_food")).toBe("After food");
    expect(foodTimingWord("anytime")).toBe("Anytime");
    expect(foodTimingWord("")).toBe(AS_DIRECTED);
    expect(foodTimingWord("with milk")).toBe("with milk");
  });
  it("Tab and Tablet share one key", () => {
    expect(medicineFormKey("Tab")).toBe("tablet");
    expect(medicineFormKey(" Tablet ")).toBe("tablet");
    expect(medicineFormKey("Syp")).toBe("syrup");
    expect(MEDICINE_FORM_WORD[medicineFormKey("Cap")]).toBe("Capsule");
    expect(medicineFormKey("Lozenge")).toBe("lozenge");
  });
  it("category tint is case-insensitive; empty is neutral", () => {
    expect(categoryTint("ANTIBIOTIC")).toBe("info");
    expect(categoryTint(" analgesic")).toBe("warning");
    expect(categoryTint("Antacid")).toBe("secondary");
    expect(categoryTint("Antifungal")).toBe("success");
    expect(categoryTint("")).toBe("neutral");
  });
  it("visit colour names", () => {
    expect(visitColourName("#0b7a75")).toBe("Teal");
    expect(visitColourName("#123456")).toBe("Custom colour");
  });
});

describe("duplicate rule (P1.1.5)", () => {
  const base = { label: "Amoxicillin", data: { strength: "500 mg", default_dose: "1 cap" } };
  it("same name + same data = same (case-insensitive name)", () => {
    expect(isSameListItem("medicines", base, { ...base, label: "amoxicillin " })).toBe(true);
  });
  it("different strength = not same", () => {
    expect(
      isSameListItem("medicines", base, { ...base, data: { ...base.data, strength: "250 mg" } }),
    ).toBe(false);
  });
  it("reviewed flag ignored", () => {
    expect(
      isSameListItem("medicines", base, { ...base, data: { ...base.data, reviewed: "yes" } }),
    ).toBe(true);
  });
  it("empty dose equals 'As directed'", () => {
    expect(
      canonicalListData("medicines", { default_dose: "" }) ===
        canonicalListData("medicines", { default_dose: AS_DIRECTED }),
    ).toBe(true);
  });
  it("empty field equals a missing field", () => {
    expect(canonicalListData("diagnoses", { code: "" })).toBe(canonicalListData("diagnoses", {}));
  });
});

describe("medicine sets (P1.2)", () => {
  const meds = [
    { id: "m1", label: "Amoxicillin", active: true },
    { id: "m2", label: "Ibuprofen", active: true },
    { id: "m3", label: "Paracetamol", active: false },
    { id: "m4", label: "paracetamol", active: true },
  ];
  it("parses ids", () => {
    expect(parseSetItemIds(" a | |b ")).toEqual(["a", "b"]);
    expect(parseSetItemIds(undefined)).toEqual([]);
  });
  it("id wins over name; renamed medicine keeps its place", () => {
    const set = { data: { items: "Old name|Ibuprofen", item_ids: "m1|m2" } };
    expect(resolveSetMedicines(set, meds).map((r) => [r.name, r.problem])).toEqual([
      ["Amoxicillin", "ok"],
      ["Ibuprofen", "ok"],
    ]);
  });
  it("hidden and missing by id", () => {
    const set = { data: { items: "Paracetamol|Gone", item_ids: "m3|zz" } };
    expect(resolveSetMedicines(set, meds).map((r) => [r.name, r.problem])).toEqual([
      ["Paracetamol", "hidden"],
      ["Gone", "missing"],
    ]);
  });
  it("old name list: hidden twin ignored, active twin used", () => {
    const r = resolveSetMedicines({ data: { items: "Paracetamol|Nothing" } }, meds);
    expect(r[0]?.medicine?.id).toBe("m4");
    expect(r[1]?.problem).toBe("missing");
  });
  it("empty set is not usable; one hidden medicine = not usable", () => {
    expect(isSetUsable({ data: { items: "" } }, meds)).toBe(false);
    expect(isSetUsable({ data: { items: "A|B", item_ids: "m1|m3" } }, meds)).toBe(false);
    expect(isSetUsable({ data: { items: "A|B", item_ids: "m1|m2" } }, meds)).toBe(true);
  });
  it("sets using a medicine, by id and by old name", () => {
    const sets: { id: string; active: boolean; data: Record<string, string> }[] = [
      { id: "s1", active: true, data: { items: "x", item_ids: "m1" } },
      { id: "s2", active: true, data: { items: "AMOXICILLIN|Ibuprofen" } },
      { id: "s3", active: false, data: { items: "x", item_ids: "m1" } },
      { id: "s4", active: true, data: { items: "Amoxicillin", item_ids: "m9" } },
    ];
    expect(setsUsingMedicine(meds[0]!, sets).map((s) => s.id)).toEqual(["s1", "s2"]);
  });
  it("removes from both lists; last medicine removed gives an empty set", () => {
    expect(withoutMedicine({ items: "A|B|C", item_ids: "m1|m2|m5" }, meds[1]!)).toEqual({
      items: "A|C",
      item_ids: "m1|m5",
    });
    expect(withoutMedicine({ items: "Amoxicillin|Ibuprofen" }, meds[0]!)).toEqual({
      items: "Ibuprofen",
    });
    expect(withoutMedicine({ items: "A", item_ids: "m1" }, meds[0]!)).toEqual({
      items: "",
      item_ids: "",
    });
  });
  it("set data from picked medicines", () => {
    expect(setDataFrom([meds[0]!, meds[1]!])).toEqual({
      items: "Amoxicillin|Ibuprofen",
      item_ids: "m1|m2",
    });
  });
});

describe("suggestions (P1.3)", () => {
  it("nothing typed gives []", () => {
    expect(suggest("medicines", "")).toEqual([]);
    expect(suggest("medicines", "   ")).toEqual([]);
  });
  it("matches only, case-insensitive, max 8", () => {
    expect(suggest("medicines", "AMOX")).toEqual(["Amoxicillin + Clavulanic Acid"]);
    expect(suggest("medicines", "zzz")).toEqual([]);
    expect(suggest("medicines", "a").length).toBeLessThanOrEqual(8);
  });
  it("no fee list exists", () => {
    expect(suggest("procedures", "1")).toEqual([]);
  });
});

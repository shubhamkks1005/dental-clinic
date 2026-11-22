import { describe, expect, it } from "vitest";
import { isListKey, LIST_KEYS, listItemSchema, roundUpToSlot, visitTypeSnapshot } from "./lists";

describe("editable lists config (1.5.4 / 2.3.2)", () => {
  it("knows its lists; unknown or prototype keys are not lists", () => {
    expect(LIST_KEYS).toEqual([
      "visit_types",
      "referral_sources",
      "diagnoses",
      "procedures",
      "conditions",
      "allergens",
      "medicines",
      "medicine_sets",
      "medical_history_items",
      "quick_phrases",
    ]);
    expect(isListKey("visit_types")).toBe(true);
    expect(isListKey("diagnoses")).toBe(true);
    expect(isListKey("medicines")).toBe(true);
    expect(isListKey("toString")).toBe(false);
  });

  it("accepts a medicine row with form, strength and defaults (4.1.1)", () => {
    expect(
      listItemSchema("medicines").parse({
        label: " Amoxicillin ",
        data: {
          brand: "SampleMox",
          form: "Cap",
          strength: "500 mg",
          default_dose: "1 cap",
          default_frequency: "1-0-1",
          default_days: "5",
          timing: "after_food",
          instruction: "Complete the course.",
          tags: "penicillin",
          category: "Antibiotic",
        },
      }),
    ).toMatchObject({
      label: "Amoxicillin",
      data: { form: "Cap", strength: "500 mg", tags: "penicillin" },
    });
  });

  it("accepts allergen match tag and a medicine set pipe list (4.1.1 / 4.1.4 / 4.1.5)", () => {
    expect(
      listItemSchema("allergens").parse({
        label: "Penicillin / antibiotic",
        data: { tag: "penicillin" },
      }).data.tag,
    ).toBe("penicillin");
    expect(
      listItemSchema("medicine_sets").parse({
        label: "After extraction",
        data: { items: "Amoxicillin|Metronidazole|Ibuprofen" },
      }).data.items,
    ).toBe("Amoxicillin|Metronidazole|Ibuprofen");
  });

  it("accepts optional procedure code and quick phrase text (3.2.3)", () => {
    expect(
      listItemSchema("procedures").parse({
        label: "Scaling",
        data: { default_paise: 150000, code: "" },
      }),
    ).toEqual({ label: "Scaling", data: { default_paise: 150000, code: "" } });
    expect(
      listItemSchema("quick_phrases").parse({
        label: "scal",
        data: { text: "Scaling and polishing done." },
      }).data.text,
    ).toBe("Scaling and polishing done.");
  });

  it("an item is a trimmed name plus the list's own fields", () => {
    expect(
      listItemSchema("visit_types").parse({
        label: " Follow-up ",
        data: { minutes: 15, color: "#0b7a75" },
      }),
    ).toEqual({ label: "Follow-up", data: { minutes: 15, color: "#0B7A75" } });
    expect(listItemSchema("referral_sources").parse({ label: "Friend", data: {} })).toEqual({
      label: "Friend",
      data: {},
    });
  });

  it("refuses an empty name, a missing or out-of-range field, and unknown fields", () => {
    const visit = listItemSchema("visit_types");
    expect(
      visit.safeParse({ label: "", data: { minutes: 15, color: "#1E4FA3" } }).error?.issues[0]
        ?.message,
    ).toBe("Enter a name.");
    expect(
      visit.safeParse({ label: "X", data: { color: "#1E4FA3" } }).error?.issues[0]?.message,
    ).toBe("Enter the usual length.");
    expect(visit.safeParse({ label: "X", data: { minutes: 20 } }).error?.issues[0]?.message).toBe(
      "Pick a colour.",
    );
    expect(
      visit.safeParse({ label: "X", data: { minutes: 500, color: "#1E4FA3" } }).error?.issues[0]
        ?.message,
    ).toBe("Usual length: at most 240 minutes.");
    expect(
      visit.safeParse({ label: "X", data: { minutes: 20, color: "blue" } }).error?.issues[0]
        ?.message,
    ).toBe("Use a colour like #1E4FA3.");
    expect(
      listItemSchema("referral_sources").safeParse({ label: "X", data: { price: 1 } }).success,
    ).toBe(false);
  });

  it("rounds visit length up to a whole slot (2.3.2)", () => {
    expect(roundUpToSlot(20, 15)).toBe(30);
    expect(roundUpToSlot(15, 15)).toBe(15);
    expect(roundUpToSlot(45, 15)).toBe(45);
    expect(roundUpToSlot(16, 15)).toBe(30);
  });

  it("booking snapshots duration so later list edits do not rewrite old bookings", () => {
    const item = {
      id: "vt-1",
      label: "Consultation",
      data: { minutes: 20, color: "#1E4FA3" },
    };
    const booked = visitTypeSnapshot(item, 15);
    expect(booked).toEqual({
      visitTypeId: "vt-1",
      visitTypeLabel: "Consultation",
      durationMin: 30,
      color: "#1E4FA3",
    });
    // Doctor shortens the list item; the already-snapshotted booking stays 30.
    item.data.minutes = 15;
    expect(booked.durationMin).toBe(30);
    expect(visitTypeSnapshot(item, 15).durationMin).toBe(15);
  });
});

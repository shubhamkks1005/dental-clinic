import { z } from "zod";

// 1.5.4 generic editable lists. A list is ONE entry here: its title and any extra fields per
// item. The API, the editor screen and the Settings section all come from this config, so a new
// list needs no new screen. Items are hidden, never deleted; records copy the item's name when
// they use it, so later edits never change old records.
export type NumberListField = {
  name: string;
  label: string;
  kind: "number";
  min: number;
  max: number;
  step: number;
  suffix: string;
};

export type ColourListField = {
  name: string;
  label: string;
  kind: "colour";
};

export type TextListField = {
  name: string;
  label: string;
  kind: "text";
  max: number;
  optional?: boolean;
  /** Kept in the item but never shown in a form (set by the Library, not typed). */
  hidden?: boolean;
  /** When set, the only values allowed ("" stays allowed for an optional field). */
  oneOf?: readonly string[];
};

export type ListField = NumberListField | ColourListField | TextListField;

export type ListDef = {
  title: string;
  itemName: string;
  help: string;
  fields: readonly ListField[];
};

export const LIST_DEFS = {
  visit_types: {
    title: "Visit types",
    itemName: "visit type",
    help: "Used when booking. The usual length fills the appointment length. Colour marks the calendar.",
    fields: [
      {
        name: "minutes",
        label: "Usual length",
        kind: "number",
        min: 5,
        max: 240,
        step: 5,
        suffix: "minutes",
      },
      { name: "color", label: "Colour", kind: "colour" },
    ],
  },
  referral_sources: {
    title: "Referral sources",
    itemName: "source",
    help: "Where new patients heard about the clinic.",
    fields: [],
  },
  // 3.2.3 clinical lists (DRAFT seeds until 3.1.1 doctor sign-off).
  diagnoses: {
    title: "Diagnoses",
    itemName: "diagnosis",
    help: "Used on visits. Adding one here shows it in autocomplete at once.",
    fields: [],
  },
  procedures: {
    title: "Procedures",
    itemName: "procedure",
    help: "Name and usual fee (paise). Optional short code for the chart and bills.",
    fields: [
      {
        name: "default_paise",
        label: "Usual fee",
        kind: "number",
        min: 0,
        max: 10_000_000,
        step: 100,
        suffix: "paise",
      },
      { name: "code", label: "Code", kind: "text", max: 20, optional: true },
    ],
  },
  conditions: {
    title: "Tooth conditions",
    itemName: "condition",
    help: "Used on the tooth chart. Colour plus icon and name (not colour alone). Applies to: surface, whole, or both.",
    fields: [
      { name: "code", label: "Code", kind: "text", max: 40 },
      { name: "color", label: "Colour", kind: "colour" },
      { name: "icon", label: "Icon", kind: "text", max: 8 },
      { name: "applies_to", label: "Applies to", kind: "text", max: 10 },
    ],
  },
  allergens: {
    title: "Allergens",
    itemName: "allergen",
    help: "Common allergies for the medical history checklist. Tag links to medicine tags (4.1.4).",
    fields: [
      {
        name: "tag",
        label: "Match tag",
        kind: "text",
        max: 40,
        optional: true,
      },
    ],
  },
  // 4.1.1 medicines (list_items; DRAFT seed in 4.1.2). Label = generic name.
  medicines: {
    title: "Medicines",
    itemName: "medicine",
    help: "Doctor's own list for prescriptions. Generic name is the row name. Brand is optional. Edits never change already-issued prescriptions.",
    fields: [
      // Library (2026-11-26): only the name is required. Empty dose, frequency, days and timing
      // are saved as "As directed" (fillAsDirected); empty form and strength stay blank.
      { name: "brand", label: "Brand", kind: "text", max: 80, optional: true },
      { name: "salt", label: "Generic / Salt", kind: "text", max: 120, optional: true },
      { name: "form", label: "Form", kind: "text", max: 20, optional: true },
      { name: "strength", label: "Strength", kind: "text", max: 40, optional: true },
      { name: "default_dose", label: "Default dose", kind: "text", max: 40, optional: true },
      {
        name: "default_frequency",
        label: "Default frequency",
        kind: "text",
        max: 20,
        optional: true,
      },
      { name: "default_days", label: "Default days", kind: "text", max: 40, optional: true },
      { name: "timing", label: "With food", kind: "text", max: 20, optional: true },
      { name: "instruction", label: "Instruction", kind: "text", max: 200, optional: true },
      { name: "tags", label: "Tags", kind: "text", max: 120, optional: true },
      { name: "category", label: "Category", kind: "text", max: 40, optional: true },
      {
        name: "combination",
        label: "Combination",
        kind: "text",
        max: 3,
        optional: true,
        oneOf: ["yes"],
      },
      // "yes" once the doctor added or saved it in the Library; blank means "Needs review".
      { name: "reviewed", label: "Reviewed", kind: "text", max: 3, optional: true, hidden: true },
    ],
  },
  // 4.1.5 everyday combos; items = pipe-separated generic names from the medicines list.
  medicine_sets: {
    title: "Medicine sets",
    itemName: "set",
    help: "One click adds several medicines to a draft prescription. Items are generic names separated by |.",
    fields: [
      { name: "items", label: "Medicines", kind: "text", max: 500 },
      // Q6 (2026-11-26): ids of the medicines, |-separated; names in items stay for old readers.
      {
        name: "item_ids",
        label: "Medicine ids",
        kind: "text",
        max: 600,
        optional: true,
        hidden: true,
      },
    ],
  },
  // 3.3.1 checklist rows (DRAFT seed until 3.1.1). section groups the form.
  medical_history_items: {
    title: "Medical history checklist",
    itemName: "question",
    help: "Yes / No / Unknown questions on the medical history form. Alert label shows on the patient when the answer is Yes.",
    fields: [
      { name: "code", label: "Code", kind: "text", max: 40 },
      { name: "section", label: "Section", kind: "text", max: 40 },
      { name: "alert_label", label: "Alert label", kind: "text", max: 80, optional: true },
      { name: "restricted", label: "Restricted (yes/blank)", kind: "text", max: 3, optional: true },
    ],
  },
  quick_phrases: {
    title: "Quick phrases",
    itemName: "phrase",
    help: "Short name expands to the full note text on the visit screen.",
    fields: [{ name: "text", label: "Full text", kind: "text", max: 500 }],
  },
} as const satisfies Record<string, ListDef>;

export type ListKey = keyof typeof LIST_DEFS;
export const LIST_KEYS = Object.keys(LIST_DEFS) as ListKey[];
export const isListKey = (key: string): key is ListKey => Object.hasOwn(LIST_DEFS, key);

export type ListItemData = Record<string, number | string>;

export type ListItem = {
  id: string;
  label: string;
  data: ListItemData;
  active: boolean;
  sortOrder: number;
  version: number;
  /** Library: who and when (names resolved by the server; seeded rows say "Starter list"). */
  createdAt?: string;
  createdByName?: string;
  updatedAt?: string;
  updatedByName?: string;
};

const numberRule = (f: NumberListField) =>
  z
    .number({ error: `Enter the ${f.label.toLowerCase()}.` })
    .int("Use a whole number.")
    .min(f.min, `${f.label}: at least ${f.min} ${f.suffix}.`)
    .max(f.max, `${f.label}: at most ${f.max} ${f.suffix}.`);

// Stored as #RRGGBB (uppercase). Calendar colour coding (2.3.2).
const colourRule = z
  .string({ error: "Pick a colour." })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #1E4FA3.")
  .transform((v) => v.toUpperCase());

const textRule = (f: TextListField) => {
  const allowed = f.oneOf;
  const base = z
    .string({ error: `Enter the ${f.label.toLowerCase()}.` })
    .trim()
    .max(f.max, `${f.label}: at most ${f.max} characters.`)
    .refine((v) => !allowed || v === "" || allowed.includes(v), {
      message: `${f.label}: use ${(allowed ?? []).join(" or ")} or leave it blank.`,
    });
  if (f.optional) {
    // B6: the key may be left out; the item then stores an empty text.
    return z
      .union([base.min(1), z.literal("")])
      .transform((v) => v)
      .default("") as unknown as typeof base;
  }
  return base.min(1, `Enter the ${f.label.toLowerCase()}.`);
};

const fieldRule = (f: ListField) => {
  if (f.kind === "number") return numberRule(f);
  if (f.kind === "colour") return colourRule;
  return f.hidden
    ? (textRule(f).default("") as unknown as ReturnType<typeof textRule>)
    : textRule(f);
};

// The rule for one item of a list: a name plus that list's extra fields.
export function listItemSchema(key: ListKey) {
  const def: ListDef = LIST_DEFS[key];
  const data = Object.fromEntries(def.fields.map((f) => [f.name, fieldRule(f)]));
  return z.object({
    label: z
      .string({ error: "Enter a name." })
      .trim()
      .min(1, "Enter a name.")
      .max(80, "The name is too long."),
    data: z.object(data).strict(),
  });
}
export type ListItemInput = { label: string; data: ListItemData };

// 2.3.2: booking length is the visit type minutes rounded UP to a whole slot.
export function roundUpToSlot(minutes: number, slotMinutes: number): number {
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error("Visit length must be a positive whole number of minutes.");
  }
  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) {
    throw new Error("Slot length must be a positive whole number of minutes.");
  }
  return Math.ceil(minutes / slotMinutes) * slotMinutes;
}

// Snapshot used when booking so later list edits do not rewrite past appointments.
export function visitTypeSnapshot(
  item: { id: string; label: string; data: ListItemData },
  slotMinutes: number,
): { visitTypeId: string; visitTypeLabel: string; durationMin: number; color: string } {
  const minutes = item.data.minutes;
  const color = item.data.color;
  if (typeof minutes !== "number" || typeof color !== "string") {
    throw new Error("Visit type needs a usual length and a colour.");
  }
  return {
    visitTypeId: item.id,
    visitTypeLabel: item.label,
    durationMin: roundUpToSlot(minutes, slotMinutes),
    color,
  };
}

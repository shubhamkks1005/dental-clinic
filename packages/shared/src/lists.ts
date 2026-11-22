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
    help: "Codes used on the tooth chart (caries, filling, RCT…).",
    fields: [{ name: "color", label: "Colour", kind: "colour" }],
  },
  allergens: {
    title: "Allergens",
    itemName: "allergen",
    help: "Common allergies for the medical history checklist.",
    fields: [],
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
  const base = z
    .string({ error: `Enter the ${f.label.toLowerCase()}.` })
    .trim()
    .max(f.max, `${f.label}: at most ${f.max} characters.`);
  if (f.optional) {
    return z.union([base.min(1), z.literal("")]).transform((v) => v);
  }
  return base.min(1, `Enter the ${f.label.toLowerCase()}.`);
};

const fieldRule = (f: ListField) => {
  if (f.kind === "number") return numberRule(f);
  if (f.kind === "colour") return colourRule;
  return textRule(f);
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

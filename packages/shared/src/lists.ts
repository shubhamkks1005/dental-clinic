import { z } from "zod";

// 1.5.4 generic editable lists. A list is ONE entry here: its title and any extra fields per
// item. The API, the editor screen and the Settings section all come from this config, so a new
// list needs no new screen. Items are hidden, never deleted; records copy the item's name when
// they use it, so later edits never change old records.
export type ListField = {
  name: string;
  label: string;
  kind: "number";
  min: number;
  max: number;
  step: number;
  suffix: string;
};

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
    help: "Used when booking. The usual length fills the appointment length.",
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
    ],
  },
  referral_sources: {
    title: "Referral sources",
    itemName: "source",
    help: "Where new patients heard about the clinic.",
    fields: [],
  },
} as const satisfies Record<string, ListDef>;

export type ListKey = keyof typeof LIST_DEFS;
export const LIST_KEYS = Object.keys(LIST_DEFS) as ListKey[];
export const isListKey = (key: string): key is ListKey => Object.hasOwn(LIST_DEFS, key);

export type ListItem = {
  id: string;
  label: string;
  data: Record<string, number>;
  active: boolean;
  sortOrder: number;
  version: number;
};

const fieldRule = (f: ListField) =>
  z
    .number({ error: `Enter the ${f.label.toLowerCase()}.` })
    .int("Use a whole number.")
    .min(f.min, `${f.label}: at least ${f.min} ${f.suffix}.`)
    .max(f.max, `${f.label}: at most ${f.max} ${f.suffix}.`);

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
export type ListItemInput = { label: string; data: Record<string, number> };

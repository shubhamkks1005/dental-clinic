import {
  AS_DIRECTED,
  LIST_DEFS,
  type ListField,
  type ListItem,
  type ListItemData,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { paiseToRupees, rupeesToPaise } from "./library-view";

// What the Add / Edit form holds: the name and every field as typed text. Turned into the API
// input on Save (fees in rupees -> paise, minutes -> number). The server checks again.

export type Draft = { label: string; data: Record<string, string> };

const fieldsOf = (key: ListKey): readonly ListField[] => LIST_DEFS[key].fields;
const AS_DIRECTED_FIELDS = new Set(["default_dose", "default_frequency", "default_days", "timing"]);

export function draftFrom(key: ListKey, item?: ListItem): Draft {
  const data: Record<string, string> = {};
  for (const f of fieldsOf(key)) {
    const v = item?.data[f.name];
    if (key === "procedures" && f.name === "default_paise") {
      data[f.name] = typeof v === "number" ? paiseToRupees(v) : "";
    } else if (f.kind === "number") {
      data[f.name] = typeof v === "number" ? String(v) : f.name === "minutes" ? "20" : "";
    } else {
      const s = typeof v === "string" ? v : "";
      // "As directed" is what the server saves for an empty field: show it as empty again.
      data[f.name] =
        key === "medicines" && AS_DIRECTED_FIELDS.has(f.name) && s === AS_DIRECTED ? "" : s;
    }
  }
  if (key === "visit_types" && !data.color) data.color = "#1E4FA3";
  return { label: item?.label ?? "", data };
}

export const sameDraft = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

export type ToInput = { ok: true; input: ListItemInput } | { ok: false; problem: string };

/** The API input, or the first problem in plain words. Medicines saved here are reviewed. */
export function toInput(key: ListKey, draft: Draft): ToInput {
  const label = draft.label.trim();
  if (!label) return { ok: false, problem: "Enter a name." };
  if (label.length > 80)
    return { ok: false, problem: "The name is too long. Use 80 characters or fewer." };
  if (key === "medicine_sets" && !(draft.data.items ?? "").trim())
    return { ok: false, problem: "A set needs at least one medicine." };
  const data: ListItemData = {};
  for (const f of fieldsOf(key)) {
    const raw = (draft.data[f.name] ?? "").trim();
    if (f.kind === "number") {
      if (key === "procedures" && f.name === "default_paise") {
        const paise = rupeesToPaise(raw);
        if (paise === null)
          return { ok: false, problem: "Enter the usual fee in rupees, like 1500." };
        if (paise > f.max) return { ok: false, problem: "The usual fee is too high." };
        data[f.name] = paise;
      } else {
        const n = Number(raw);
        if (!raw || !Number.isInteger(n) || n < f.min || n > f.max)
          return { ok: false, problem: `${f.label}: ${f.min} to ${f.max} ${f.suffix}.` };
        data[f.name] = n;
      }
      continue;
    }
    if (f.kind === "colour") {
      if (!/^#[0-9A-Fa-f]{6}$/.test(raw)) return { ok: false, problem: "Pick a colour." };
      data[f.name] = raw.toUpperCase();
      continue;
    }
    if (!raw && !f.optional && !f.hidden)
      return { ok: false, problem: `Enter the ${f.label.toLowerCase()}.` };
    if (raw.length > f.max)
      return { ok: false, problem: `${f.label}: at most ${f.max} characters.` };
    data[f.name] = raw;
  }
  if (key === "medicines") data.reviewed = "yes";
  return { ok: true, input: { label, data } };
}

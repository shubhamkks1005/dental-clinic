import { AS_DIRECTED, fillAsDirected, type ListItemInput } from "@clinic/shared";

export const MEDICINE_FORMS = ["Tablet", "Capsule", "Syrup", "Gel", "Mouthwash", "Other"] as const;

/** Saved in an empty usual dose, frequency, days and timing (one rule: packages/shared). */
export { AS_DIRECTED };

type Extra = Partial<
  Record<
    "brand" | "default_dose" | "default_frequency" | "default_days" | "timing" | "instruction",
    string
  >
>;

/**
 * A new medicine from inside a visit: name, strength and form. The usual dose, frequency, days
 * and timing read "As directed" until written (shared fillAsDirected, the same rule the server
 * applies). `reviewed` is "yes" only when the doctor typed it in the Library; a medicine added
 * from inside a visit stays "Needs review".
 */
export function newMedicineInput(
  base: { label: string; strength: string; form: string; reviewed: boolean },
  extra: Extra = {},
): ListItemInput {
  const trim = (v: string | undefined) => v?.trim() ?? "";
  return {
    label: base.label.trim(),
    data: fillAsDirected({
      brand: trim(extra.brand),
      form: base.form,
      strength: base.strength.trim(),
      default_dose: trim(extra.default_dose),
      default_frequency: trim(extra.default_frequency),
      default_days: trim(extra.default_days),
      timing: trim(extra.timing),
      instruction: trim(extra.instruction),
      tags: "",
      category: "",
      reviewed: base.reviewed ? "yes" : "",
    }),
  };
}

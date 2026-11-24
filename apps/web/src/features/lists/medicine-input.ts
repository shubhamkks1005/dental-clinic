import type { ListItemInput } from "@clinic/shared";

export const MEDICINE_FORMS = ["Tablet", "Capsule", "Syrup", "Gel", "Mouthwash", "Other"] as const;

/** DRAFT wording (DECISIONS.md): the doctor still has to confirm "As directed". */
export const AS_DIRECTED = "As directed";

type Extra = Partial<
  Record<
    "brand" | "default_dose" | "default_frequency" | "default_days" | "timing" | "instruction",
    string
  >
>;

/**
 * A new medicine needs only name, strength and form. The usual dose, frequency, days and timing
 * read "As directed" until written. `reviewed` is "yes" only when the doctor typed it in the
 * Library; a medicine added from inside a visit stays "Needs review".
 */
export function newMedicineInput(
  base: { label: string; strength: string; form: string; reviewed: boolean },
  extra: Extra = {},
): ListItemInput {
  const pick = (v: string | undefined) => (v?.trim() ? v.trim() : AS_DIRECTED);
  return {
    label: base.label.trim(),
    data: {
      brand: extra.brand?.trim() ?? "",
      form: base.form,
      strength: base.strength.trim(),
      default_dose: pick(extra.default_dose),
      default_frequency: pick(extra.default_frequency),
      default_days: pick(extra.default_days),
      timing: pick(extra.timing),
      instruction: extra.instruction?.trim() ?? "",
      tags: "",
      category: "",
      reviewed: base.reviewed ? "yes" : "",
    },
  };
}

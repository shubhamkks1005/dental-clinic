/** 3.4.6: default tooth chart dentition from age (years). Manual override stays in the UI. */
export type DentitionView = "primary" | "mixed" | "permanent";

export function dentitionFromAgeYears(ageYears: number | null | undefined): DentitionView {
  if (ageYears == null || ageYears < 0) return "permanent";
  if (ageYears < 6) return "primary";
  if (ageYears < 13) return "mixed";
  return "permanent";
}

export const DENTITION_LABEL: Record<DentitionView, string> = {
  primary: "Primary (baby teeth)",
  mixed: "Mixed",
  permanent: "Permanent",
};

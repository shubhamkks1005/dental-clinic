import { ageYearsFromDob, parseDisplayDate } from "@clinic/shared";

/** Age in whole years from a typed DD/MM/YYYY date of birth; null until it is a real, sensible date. */
export function ageFromBirthInput(raw: string | undefined, today: string): number | null {
  const iso = raw ? parseDisplayDate(raw) : null;
  if (!iso) return null;
  const age = ageYearsFromDob(iso, today);
  return age >= 0 && age <= 120 ? age : null;
}

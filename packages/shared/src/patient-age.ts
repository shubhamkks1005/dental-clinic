// Age for display (2.1.4) and minor checks (2.1.3). Never store a "current age" column.

export const MINOR_UNDER_YEARS = 18;

/** Full years between two YYYY-MM-DD dates (onDate minus fromDate). */
export function fullYearsBetween(fromDate: string, onDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [oy, om, od] = onDate.split("-").map(Number);
  if (!fy || !fm || !fd || !oy || !om || !od) return 0;
  let years = oy - fy;
  if (om < fm || (om === fm && od < fd)) years -= 1;
  return years;
}

/** Age in whole years on a clinic date, from DOB (YYYY-MM-DD). */
export function ageYearsFromDob(dateOfBirth: string, onDate: string): number {
  return fullYearsBetween(dateOfBirth, onDate);
}

export type AgeSource = {
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  /** Registration day YYYY-MM-DD (from created_at date in IST, or the form's day). */
  registeredOn: string;
};

/**
 * Display / rule age on `onDate`. Prefer DOB; otherwise age-at-registration plus years since then.
 * Returns null only when neither DOB nor age-at-reg is present.
 */
export function ageYearsOn(source: AgeSource, onDate: string): number | null {
  if (source.dateOfBirth) return ageYearsFromDob(source.dateOfBirth, onDate);
  if (source.ageYearsAtReg == null) return null;
  const grown = fullYearsBetween(source.registeredOn, onDate);
  return source.ageYearsAtReg + Math.max(0, grown);
}

export function isMinor(source: AgeSource, onDate: string): boolean {
  const age = ageYearsOn(source, onDate);
  return age != null && age < MINOR_UNDER_YEARS;
}

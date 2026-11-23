// 6.2.1: "new patient" = first arrived on this day and not an imported paper register row.
export function isNewPatientOn(
  patient: { firstArrivedOn: string | null; legacyRef: string | null | undefined },
  dayLocal: string,
): boolean {
  if (!patient.firstArrivedOn || patient.firstArrivedOn !== dayLocal) return false;
  return !patient.legacyRef;
}

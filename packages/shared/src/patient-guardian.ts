import { normaliseMobile } from "./mobile";
import { isMinor, type AgeSource } from "./patient-age";

export type GuardianFields = {
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
};

export type PatientGuardianInput = AgeSource & GuardianFields;

/**
 * 2.1.3: under 18 needs guardian name, relation and a valid Indian mobile.
 * Final DPDP wording still waits on a lawyer (see STATE); this is the clinic save rule.
 * Returns a plain sentence for the form, or null when save is allowed.
 */
export function guardianSaveError(input: PatientGuardianInput, onDate: string): string | null {
  if (!isMinor(input, onDate)) return null;
  if (!input.guardianName?.trim()) {
    return "Add the guardian's name. Patients under 18 need a guardian on the record.";
  }
  if (!input.guardianRelation?.trim()) {
    return "Add how the guardian is related to the patient.";
  }
  const mobile = input.guardianMobile ? normaliseMobile(input.guardianMobile) : null;
  if (!mobile) {
    return "Add a valid mobile number for the guardian.";
  }
  return null;
}

/** Normalised guardian fields ready to store (nulls when not a minor or blank). */
export function normalisedGuardian(input: GuardianFields): GuardianFields {
  const name = input.guardianName?.trim() || null;
  const relation = input.guardianRelation?.trim() || null;
  const mobileRaw = input.guardianMobile?.trim() || null;
  const mobile = mobileRaw ? normaliseMobile(mobileRaw) : null;
  return { guardianName: name, guardianRelation: relation, guardianMobile: mobile };
}

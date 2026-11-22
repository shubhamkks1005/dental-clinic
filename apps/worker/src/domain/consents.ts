import type { NewConsent, Repos } from "@clinic/db";
import type { ConsentRow } from "@clinic/shared";

export const listPatientConsents = (repos: Repos, patientId: string): Promise<ConsentRow[]> =>
  repos.consents.listForPatient(patientId);

export const recordPatientConsent = (
  repos: Repos,
  patientId: string,
  input: NewConsent,
): Promise<ConsentRow[]> => repos.consents.record(patientId, input);

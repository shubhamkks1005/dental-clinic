import type { NewConsent, Repos } from "@clinic/db";
import type { ConsentRow } from "@clinic/shared";

export const listPatientConsents = (repos: Repos, patientId: string): Promise<ConsentRow[]> =>
  repos.consents.listForPatient(patientId);

export async function recordPatientConsent(
  repos: Repos,
  patientId: string,
  input: NewConsent,
): Promise<ConsentRow[]> {
  const rows = await repos.consents.record(patientId, input);
  // 7.3.3 / 7.7.1: withdrawing SMS reminders cancels queued / WhatsApp-pending messages.
  if (input.type === "sms_reminders" && input.given === false) {
    await repos.messages.cancelQueuedForPatient(patientId, "consent_withdrawn");
  }
  return rows;
}

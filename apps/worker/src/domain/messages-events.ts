import { planCancelMessage, planRescheduleMessage, type PlanAppointment } from "@clinic/shared";
import type { Repos } from "@clinic/db";
import { buildBody, enqueuePlanned, loadMessagingConfig, messagingMode } from "./messages";

type ApptFields = {
  id: string;
  patientId: string;
  dateLocal: string;
  startMin: number;
  status: string;
  startAt: string;
};

export const OUT_OF_DATE = "out_of_date";

/**
 * Q1.5: an appointment was cancelled or moved. Its queued confirm and reminder messages are now
 * wrong, so they are marked out of date, and ONE "cancelled" or "moved" message is queued for the
 * (new) appointment. Never throws: a message problem must not undo the booking change.
 */
export async function messagesAfterAppointmentChange(
  repos: Repos,
  change: { kind: "cancel"; appt: ApptFields } | { kind: "move"; oldId: string; appt: ApptFields },
  envMode: string,
  now: Date = new Date(),
): Promise<void> {
  try {
    const oldId = change.kind === "move" ? change.oldId : change.appt.id;
    await repos.messages.cancelQueuedForAppointment(oldId, OUT_OF_DATE);

    const { settings, templates, clinicName, clinicPhone } = await loadMessagingConfig(repos);
    if (!settings.enabled) return;
    const appt = change.appt;
    if (new Date(appt.startAt).getTime() <= now.getTime() && change.kind === "move") return;
    const recipient = (await repos.messagesPlan.recipients([appt.patientId])).get(appt.patientId);
    const consents = await repos.messagesPlan.latestSmsReminderConsent([appt.patientId]);
    const hasConsent = consents.get(appt.patientId) === true;
    const plan: PlanAppointment = { ...appt };
    const planned =
      change.kind === "cancel"
        ? planCancelMessage(plan, settings, now, hasConsent, !recipient?.mobile)
        : planRescheduleMessage(plan, settings, now, hasConsent, !recipient?.mobile);
    const body = buildBody({
      templates,
      planned,
      firstName: recipient?.addressName ?? "Patient",
      onBehalfOf: recipient?.onBehalfOf ?? null,
      clinicName,
      clinicPhone,
      dateLocal: appt.dateLocal,
      startMin: appt.startMin,
    });
    await enqueuePlanned(repos, planned, {
      body,
      settings,
      mode: messagingMode(envMode),
      audit: true,
    });
  } catch {
    /* swallowed on purpose; the outbox board shows what was queued */
  }
}

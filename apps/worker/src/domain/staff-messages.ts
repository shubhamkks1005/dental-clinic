import {
  MESSAGE_TEMPLATE_KEYS,
  newUlid,
  planCancelMessage,
  planRescheduleMessage,
  waLink,
  type MessageTemplateKey,
  type PlanAppointment,
} from "@clinic/shared";
import type { Repos } from "@clinic/db";
import { InvalidError, NotFoundError } from "@clinic/db";
import { buildBody, enqueuePlanned, loadMessagingConfig, messagingMode } from "./messages";

function publicRow(row: {
  id: string;
  patientId: string;
  appointmentId: string | null;
  kind: string;
  channel: string;
  templateKey: string;
  body: string;
  status: string;
  sendAfter: string;
  expireAt: string;
  skipReason: string | null;
  createdAt: string;
  attempts: number;
  lastErrorCode: string | null;
}) {
  return {
    id: row.id,
    patientId: row.patientId,
    appointmentId: row.appointmentId,
    kind: row.kind,
    channel: row.channel,
    templateKey: row.templateKey,
    body: row.body,
    status: row.status,
    sendAfter: row.sendAfter,
    expireAt: row.expireAt,
    skipReason: row.skipReason,
    createdAt: row.createdAt,
    attempts: row.attempts,
    lastErrorCode: row.lastErrorCode,
  };
}

export async function messagesBoard(repos: Repos) {
  const [outgoing, scheduled, outOfDate, sentToday, attention, whatsapp] = await Promise.all([
    repos.messages.listBoard("outgoing"),
    repos.messages.listBoard("scheduled"),
    repos.messages.listBoard("out_of_date"),
    repos.messages.listBoard("sent_today"),
    repos.messages.listBoard("attention"),
    repos.messages.listBoard("whatsapp"),
  ]);
  return {
    outgoing: outgoing.map(publicRow),
    scheduled: scheduled.map(publicRow),
    outOfDate: outOfDate.map(publicRow),
    sentToday: sentToday.map(publicRow),
    attention: attention.map(publicRow),
    whatsapp: whatsapp.map(publicRow),
  };
}

export async function patientMessages(repos: Repos, patientId: string) {
  const rows = await repos.messages.listForPatient(patientId);
  return { messages: rows.map(publicRow) };
}

export async function openMessageInWhatsApp(
  repos: Repos,
  id: string,
  mode: string,
): Promise<{ message: ReturnType<typeof publicRow>; waUrl: string }> {
  void messagingMode(mode);
  const row = await repos.messages.get(id);
  const mobile = await repos.messagesPlan.patientMobile(row.patientId);
  if (!mobile) throw new InvalidError("This patient has no mobile number for WhatsApp.");
  const link = waLink(mobile, row.body);
  if (!link) throw new InvalidError("That mobile number cannot be used for WhatsApp.");
  const updated = await repos.messages.markOpenedInWhatsApp(id);
  return { message: publicRow(updated), waUrl: link };
}

export async function markMessageDoneManual(repos: Repos, id: string) {
  const updated = await repos.messages.markDoneManual(id);
  return { message: publicRow(updated) };
}

export async function cancelMessage(repos: Repos, id: string) {
  const before = await repos.messages.get(id);
  await repos.messages.setStatus(id, "cancelled", { lastErrorCode: "staff_cancel" });
  const after = await repos.messages.get(id);
  void before;
  return { message: publicRow(after) };
}

export async function dumpQueuedSmsToWhatsApp(repos: Repos) {
  const n = await repos.messages.convertQueuedSmsToWhatsApp();
  return { converted: n };
}

export async function createOneOffPatientMessage(
  repos: Repos,
  patientId: string,
  templateKey: string,
  envMode: string,
) {
  if (!(MESSAGE_TEMPLATE_KEYS as readonly string[]).includes(templateKey)) {
    throw new InvalidError("Pick a valid message template.");
  }
  const key = templateKey as MessageTemplateKey;
  if (key === "otp") throw new InvalidError("OTP messages are not sent from the staff app.");

  const consents = await repos.messagesPlan.latestSmsReminderConsent([patientId]);
  if (consents.get(patientId) !== true) {
    throw new InvalidError("This patient has not consented to reminder messages.");
  }

  const recipient = (await repos.messagesPlan.recipients([patientId])).get(patientId);
  if (!recipient) throw new NotFoundError("That patient");
  if (!recipient.mobile) throw new InvalidError("This patient has no mobile number for messages.");

  const { settings, templates, clinicName, clinicPhone } = await loadMessagingConfig(repos);
  const mode = messagingMode(envMode);
  const kindMap: Record<string, import("@clinic/shared").MessageKind> = {
    confirm: "confirm",
    remind: "remind",
    reschedule: "reschedule",
    cancel: "cancel",
    recall: "recall",
    incomplete: "incomplete",
    dues: "dues",
  };
  const planned = {
    kind: kindMap[key] ?? ("confirm" as const),
    templateKey: key,
    patientId,
    appointmentId: null as string | null,
    dedupeKey: `manual:${patientId}:${key}:${newUlid()}`,
    sendAfter: new Date().toISOString(),
    expireAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    status: "queued" as const,
  };

  const body = buildBody({
    templates,
    planned,
    firstName: recipient.addressName,
    onBehalfOf: recipient.onBehalfOf,
    clinicName,
    clinicPhone,
  });
  const { id } = await enqueuePlanned(repos, planned, { body, settings, mode, audit: true });
  const row = await repos.messages.get(id);
  const mobile = await repos.messagesPlan.patientMobile(patientId);
  const link = mobile && row.body ? waLink(mobile, row.body) : null;
  if (link && row.status === "needs_human") {
    const opened = await repos.messages.markOpenedInWhatsApp(id);
    return { message: publicRow(opened), waUrl: link };
  }
  return { message: publicRow(row), waUrl: link };
}

export async function sendAppointmentMessageNow(
  repos: Repos,
  appointmentId: string,
  kind: "confirm" | "remind" | "cancel" | "reschedule",
  envMode: string,
) {
  const appt = await repos.messagesPlan.getAppointment(appointmentId);
  if (!appt) throw new NotFoundError("That appointment");
  const planAppt: PlanAppointment = {
    id: appt.id,
    patientId: appt.patientId,
    dateLocal: appt.dateLocal,
    startMin: appt.startMin,
    status: appt.status,
    startAt: appt.startAt,
  };
  const consents = await repos.messagesPlan.latestSmsReminderConsent([appt.patientId]);
  const hasConsent = consents.get(appt.patientId) === true;
  const { settings, templates, clinicName, clinicPhone } = await loadMessagingConfig(repos);
  const mode = messagingMode(envMode);
  const now = new Date();

  let planned;
  if (kind === "cancel") planned = planCancelMessage(planAppt, settings, now, hasConsent);
  else if (kind === "reschedule")
    planned = planRescheduleMessage(planAppt, settings, now, hasConsent);
  else {
    planned = {
      kind,
      templateKey: kind === "remind" ? "remind" : "confirm",
      patientId: appt.patientId,
      appointmentId: appt.id,
      dedupeKey: `${kind}:${appt.id}:${appt.startAt}:now:${newUlid()}`,
      sendAfter: now.toISOString(),
      expireAt: appt.startAt,
      status: hasConsent ? ("queued" as const) : ("skipped" as const),
      skipReason: hasConsent ? undefined : "no_sms_reminders_consent",
    };
  }

  if (planned.status === "skipped") {
    throw new InvalidError("This patient has not consented to reminder messages.");
  }

  const recipient = (await repos.messagesPlan.recipients([appt.patientId])).get(appt.patientId);
  if (!recipient?.mobile) throw new InvalidError("This patient has no mobile number for messages.");
  const body = buildBody({
    templates,
    planned,
    firstName: recipient.addressName,
    onBehalfOf: recipient.onBehalfOf,
    clinicName,
    clinicPhone,
    dateLocal: appt.dateLocal,
    startMin: appt.startMin,
  });
  const { id } = await enqueuePlanned(repos, planned, { body, settings, mode, audit: true });
  const row = await repos.messages.get(id);
  const mobile = await repos.messagesPlan.patientMobile(appt.patientId);
  const link = mobile && row.body ? waLink(mobile, row.body) : null;
  if (link && (row.status === "needs_human" || row.status === "queued")) {
    const opened = await repos.messages.markOpenedInWhatsApp(id);
    return { message: publicRow(opened), waUrl: link };
  }
  return { message: publicRow(row), waUrl: link };
}

export async function messagingStatus(repos: Repos, envMode: string) {
  // patients.view first (developer has settings.read but must not see messaging status).
  await repos.messages.listBoard("outgoing");
  const { settings } = await loadMessagingConfig(repos);
  return {
    mode: messagingMode(envMode),
    enabled: settings.enabled,
    whatsappEnabled: settings.whatsappEnabled,
    smsEnabled: settings.smsEnabled,
    draftBanner: "DRAFT - doctor to confirm",
  };
}

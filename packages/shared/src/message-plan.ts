import type { MessagingSettings, MessageKind } from "./messaging";
import { istDate, istLocalToUtc, istMinutes } from "./time";

export type PlanAppointment = {
  id: string;
  patientId: string;
  dateLocal: string;
  startMin: number;
  status: string;
  /** ISO UTC start. */
  startAt: string;
  /** Set when this booking replaced an earlier one: the "moved" message covers the confirmation. */
  rescheduledFrom?: string | null;
};

export type PlanConsent = { patientId: string; smsReminders: boolean };
export type PlanFlag = { phone: string; flag: string };

export type PlannedMessage = {
  kind: MessageKind;
  templateKey: string;
  patientId: string;
  appointmentId: string | null;
  dedupeKey: string;
  sendAfter: string;
  expireAt: string;
  status: "queued" | "skipped" | "held";
  skipReason?: string;
};

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** If sendAt falls in quiet hours (IST), bump to next quietEnd. */
export function respectQuietHours(sendAt: Date, settings: MessagingSettings): Date {
  const mins = istMinutes(sendAt);
  const start = hhmmToMin(settings.quietStartLocal);
  const end = hhmmToMin(settings.quietEndLocal);
  const inQuiet = start > end ? mins >= start || mins < end : mins >= start && mins < end;
  if (!inQuiet) return sendAt;
  const day = istDate(sendAt);
  const bumpDay = mins >= start ? addOneDay(day) : day;
  return istLocalToUtc(bumpDay, end);
}

function addOneDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + 1));
  return dt.toISOString().slice(0, 10);
}

function dayNameIst(dateLocal: string): string {
  const [y, m, d] = dateLocal.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, d!, 6, 30));
  return utc.toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
}

export function formatSamay(startMin: number): string {
  const h24 = Math.floor(startMin / 60);
  const min = startMin % 60;
  const am = h24 < 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${am ? "am" : "pm"}`;
}

export function formatTareekh(dateLocal: string): string {
  const [y, m, d] = dateLocal.split("-");
  return `${d}/${m}/${y}`;
}

export { dayNameIst };

/**
 * Pure planner (7.2.4). Caller enqueues / cancels against outbox.
 * Default channel is decided by enqueuer (whatsapp_manual in Phase 7).
 */
export function planMessages(input: {
  appointments: PlanAppointment[];
  consents: PlanConsent[];
  settings: MessagingSettings;
  now: Date;
  /** When messaging kill switch off. */
  messagingEnabled?: boolean;
  /** Q1.5: patients with no usable number (own, guardian or emergency): nothing is queued. */
  noNumber?: Set<string>;
}): PlannedMessage[] {
  const { appointments, consents, settings, now } = input;
  if (input.messagingEnabled === false || !settings.enabled) return [];

  const consentBy = new Map(consents.map((c) => [c.patientId, c.smsReminders]));
  const out: PlannedMessage[] = [];

  for (const appt of appointments) {
    if (["cancelled", "rescheduled", "no_show"].includes(appt.status)) continue;
    const start = new Date(appt.startAt);
    // Q1.5: a booking that has already started gets no confirmation and no reminder.
    if (start.getTime() <= now.getTime()) continue;
    const hasConsent = consentBy.get(appt.patientId) === true;
    const noNumber = input.noNumber?.has(appt.patientId) === true;
    const expireAt = start.toISOString();

    if (settings.kinds.confirm && !appt.rescheduledFrom) {
      out.push(
        makeApptPlan({
          kind: "confirm",
          templateKey: "confirm",
          appt,
          hasConsent,
          noNumber,
          sendAfter: respectQuietHours(now, settings).toISOString(),
          expireAt,
          dedupeKey: `confirm:${appt.id}:${appt.startAt}`,
        }),
      );
    }

    if (settings.kinds.remind) {
      const remindLocal = remindSendAt(appt, settings);
      const leadMs = settings.minLeadMinutes * 60_000;
      if (
        start.getTime() - now.getTime() >= leadMs &&
        remindLocal.getTime() < start.getTime() - leadMs
      ) {
        out.push(
          makeApptPlan({
            kind: "remind",
            templateKey: "remind",
            appt,
            hasConsent,
            noNumber,
            sendAfter: respectQuietHours(remindLocal, settings).toISOString(),
            expireAt: new Date(start.getTime() - leadMs).toISOString(),
            dedupeKey: `remind:${appt.id}:${appt.startAt}:1`,
          }),
        );
      }
    }

    if (settings.kinds.same_day_remind) {
      const sameDay = new Date(start.getTime() - 3 * 3600_000);
      if (sameDay > now && start.getTime() - now.getTime() > 60 * 60_000) {
        out.push(
          makeApptPlan({
            kind: "same_day_remind",
            templateKey: "remind",
            appt,
            hasConsent,
            noNumber,
            sendAfter: respectQuietHours(sameDay, settings).toISOString(),
            expireAt: new Date(start.getTime() - 60 * 60_000).toISOString(),
            dedupeKey: `remind:${appt.id}:${appt.startAt}:same`,
          }),
        );
      }
    }
  }

  return out;
}

function remindSendAt(appt: PlanAppointment, settings: MessagingSettings): Date {
  const [y, m, d] = appt.dateLocal.split("-").map(Number);
  const prev = new Date(Date.UTC(y!, m! - 1, d! - 1));
  const prevDay = prev.toISOString().slice(0, 10);
  const atMin = hhmmToMin(settings.remindAtLocal);
  return istLocalToUtc(prevDay, atMin);
}

function makeApptPlan(args: {
  kind: MessageKind;
  templateKey: string;
  appt: PlanAppointment;
  hasConsent: boolean;
  noNumber?: boolean;
  sendAfter: string;
  expireAt: string;
  dedupeKey: string;
}): PlannedMessage {
  if (args.noNumber) {
    return {
      kind: args.kind,
      templateKey: args.templateKey,
      patientId: args.appt.patientId,
      appointmentId: args.appt.id,
      dedupeKey: args.dedupeKey,
      sendAfter: args.sendAfter,
      expireAt: args.expireAt,
      status: "skipped",
      skipReason: "no_number",
    };
  }
  if (!args.hasConsent) {
    return {
      kind: args.kind,
      templateKey: args.templateKey,
      patientId: args.appt.patientId,
      appointmentId: args.appt.id,
      dedupeKey: args.dedupeKey,
      sendAfter: args.sendAfter,
      expireAt: args.expireAt,
      status: "skipped",
      skipReason: "no_sms_reminders_consent",
    };
  }
  return {
    kind: args.kind,
    templateKey: args.templateKey,
    patientId: args.appt.patientId,
    appointmentId: args.appt.id,
    dedupeKey: args.dedupeKey,
    sendAfter: args.sendAfter,
    expireAt: args.expireAt,
    status: "queued",
  };
}

export function planCancelMessage(
  appt: PlanAppointment,
  settings: MessagingSettings,
  now: Date,
  hasConsent: boolean,
  noNumber = false,
): PlannedMessage {
  return makeApptPlan({
    kind: "cancel",
    noNumber,
    templateKey: "cancel",
    appt,
    hasConsent: hasConsent && settings.kinds.cancel,
    sendAfter: respectQuietHours(now, settings).toISOString(),
    expireAt: new Date(appt.startAt).toISOString(),
    dedupeKey: `cancel:${appt.id}`,
  });
}

export function planRescheduleMessage(
  appt: PlanAppointment,
  settings: MessagingSettings,
  now: Date,
  hasConsent: boolean,
  noNumber = false,
): PlannedMessage {
  return makeApptPlan({
    kind: "reschedule",
    noNumber,
    templateKey: "reschedule",
    appt,
    hasConsent: hasConsent && settings.kinds.reschedule,
    sendAfter: respectQuietHours(now, settings).toISOString(),
    expireAt: new Date(appt.startAt).toISOString(),
    dedupeKey: `resched:${appt.id}:${appt.startAt}`,
  });
}

import {
  DEFAULT_MESSAGING_SETTINGS,
  DRAFT_MESSAGE_TEMPLATES,
  dayNameIst,
  formatSamay,
  formatTareekh,
  patientFirstName,
  renderMessageTemplate,
  speakForPatient,
  smsSegmentCount,
  waLink,
  type MessageTemplates,
  type MessagingSettings,
  type PlannedMessage,
} from "@clinic/shared";
import type { Repos } from "@clinic/db";
import { createFakeMessageAdapter } from "../adapters/message-fake";
import { createManualWhatsAppAdapter } from "../adapters/message-whatsapp-manual";
import { createSmsGatewayStubAdapter } from "../adapters/message-sms-stub";
import type { MessageChannel } from "../adapters/message-channel";

export function messagingMode(envMode: string | undefined): "dry_run" | "live" {
  return envMode === "live" ? "live" : "dry_run";
}

export function channelForKind(
  _kind: string,
  settings: MessagingSettings,
): "whatsapp_manual" | "sms" {
  // Phase 7 owner: no SMS provider — WhatsApp manual is the default path.
  if (settings.whatsappEnabled) return "whatsapp_manual";
  if (settings.smsEnabled) return "sms";
  return "whatsapp_manual";
}

export function pickAdapter(channel: string, mode: "dry_run" | "live"): MessageChannel {
  if (channel === "whatsapp_manual") return createManualWhatsAppAdapter();
  if (mode === "dry_run") return createFakeMessageAdapter();
  // Live SMS not configured in Phase 7.
  return createSmsGatewayStubAdapter();
}

export async function loadMessagingConfig(repos: Repos): Promise<{
  settings: MessagingSettings;
  templates: MessageTemplates;
  clinicName: string;
  clinicPhone: string;
}> {
  const list = await repos.settings.list();
  const byKey = new Map(list.map((s) => [s.key, s.value]));
  const settings =
    (byKey.get("messaging.settings") as MessagingSettings | undefined) ??
    DEFAULT_MESSAGING_SETTINGS;
  const templates =
    (byKey.get("messaging.templates") as MessageTemplates | undefined) ?? DRAFT_MESSAGE_TEMPLATES;
  const clinicName = String(byKey.get("clinic.name") ?? "Align Dentistry");
  const clinicPhone = String(byKey.get("clinic.phone") ?? "");
  return { settings, templates, clinicName, clinicPhone };
}

export function buildBody(args: {
  templates: MessageTemplates;
  planned: PlannedMessage;
  firstName: string;
  clinicName: string;
  clinicPhone: string;
  dateLocal?: string;
  startMin?: number;
  /** Q1.5: patient first name when the message goes to a guardian or other contact. */
  onBehalfOf?: string | null;
}): string {
  if (args.planned.status === "skipped") return "";
  const key = args.planned.templateKey as keyof MessageTemplates["templates"];
  const din = args.dateLocal ? dayNameIst(args.dateLocal) : "";
  const tareekh = args.dateLocal ? formatTareekh(args.dateLocal) : "";
  const samay = args.startMin !== undefined ? formatSamay(args.startMin) : "";
  const text = renderMessageTemplate(args.templates, key, {
    naam: args.firstName,
    clinic: args.clinicName,
    din,
    tareekh,
    samay,
    fone: args.clinicPhone || "the clinic",
  });
  return speakForPatient(text, args.onBehalfOf ?? null);
}

export async function enqueuePlanned(
  repos: Repos,
  planned: PlannedMessage,
  opts: {
    body: string;
    settings: MessagingSettings;
    mode: "dry_run" | "live";
    audit?: boolean;
  },
): Promise<{ id: string; created: boolean }> {
  const channel = channelForKind(planned.kind, opts.settings);
  let status: import("@clinic/shared").MessageStatus = planned.status;
  if (status === "queued" && channel === "whatsapp_manual") status = "needs_human";
  if (status === "queued" && opts.mode === "dry_run" && channel === "sms") status = "dry_run";

  return repos.messages.enqueue({
    patientId: planned.patientId,
    appointmentId: planned.appointmentId,
    kind: planned.kind,
    channel,
    templateKey: planned.templateKey,
    params: {},
    body: status === "skipped" ? "" : opts.body,
    segments: status === "skipped" ? 0 : smsSegmentCount(opts.body),
    status,
    dedupeKey: planned.dedupeKey,
    sendAfter: planned.sendAfter,
    expireAt: planned.expireAt,
    skipReason: planned.skipReason,
    audit: opts.audit,
  });
}

export function whatsAppOpenPayload(
  mobile: string,
  body: string,
): {
  waUrl: string | null;
  maskedMobile: string;
} {
  const link = waLink(mobile, body);
  return {
    waUrl: link,
    maskedMobile: mobile.replace(/^\+91(\d{2})\d{6}(\d{2})$/, "+91 $1••••$2"),
  };
}

export { patientFirstName };

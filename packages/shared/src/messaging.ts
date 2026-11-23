import { z } from "zod";
import { normaliseMobile } from "./mobile";

/** 7.2: outbox statuses. `opened_in_whatsapp` = receptionist opened wa.me (owner Phase 7). */
export const MESSAGE_STATUSES = [
  "queued",
  "held",
  "sending",
  "sent",
  "delivered",
  "failed",
  "expired",
  "cancelled",
  "skipped",
  "unknown",
  "needs_human",
  "done_manual",
  "dry_run",
  "opened_in_whatsapp",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MESSAGE_CHANNELS = ["sms", "whatsapp_manual", "email"] as const;
export type MessageChannelKind = (typeof MESSAGE_CHANNELS)[number];

export const MESSAGE_KINDS = [
  "confirm",
  "remind",
  "same_day_remind",
  "reschedule",
  "cancel",
  "recall",
  "incomplete",
  "dues",
  "otp",
] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_TEMPLATE_KEYS = [
  "confirm",
  "remind",
  "reschedule",
  "cancel",
  "recall",
  "incomplete",
  "dues",
  "otp",
] as const;
export type MessageTemplateKey = (typeof MESSAGE_TEMPLATE_KEYS)[number];

/** Only these placeholders may appear in templates (7.2.3). */
export const MESSAGE_TEMPLATE_VARS = [
  "naam",
  "clinic",
  "din",
  "tareekh",
  "samay",
  "fone",
  "otp",
] as const;
export type MessageTemplateVar = (typeof MESSAGE_TEMPLATE_VARS)[number];

export const PHONE_FLAGS = ["opted_out", "wrong_number", "no_whatsapp", "landline"] as const;
export type PhoneFlag = (typeof PHONE_FLAGS)[number];

export const CHANNEL_STATES = ["ok", "down", "breaker_open"] as const;
export type ChannelStateValue = (typeof CHANNEL_STATES)[number];

/** First word for templates; capped so GSM segment stays 1. */
export function patientFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const cut = first.slice(0, 20);
  return cut.length > 0 ? cut : "Patient";
}

/** Mask for screens/logs — never full mobile in logs (7.7.2). */
export function maskMobile(stored: string): string {
  const ten = stored.replace(/^\+91/, "");
  if (ten.length !== 10) return "••••";
  return `${ten.slice(0, 2)}••••${ten.slice(8)}`;
}

/**
 * Official wa.me click-to-chat (7.3.2). Digits only with country code 91; text UTF-8 encoded.
 * Returns null if the number is not a valid Indian mobile.
 */
export function waLink(mobile: string, text: string): string | null {
  const n = normaliseMobile(mobile);
  if (!n) return null;
  const digits = n.replace(/^\+/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const messagingSettingsSchema = z.object({
  enabled: z.boolean(),
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  kinds: z.object({
    confirm: z.boolean(),
    remind: z.boolean(),
    same_day_remind: z.boolean(),
    reschedule: z.boolean(),
    cancel: z.boolean(),
    recall: z.boolean(),
    incomplete: z.boolean(),
    dues: z.boolean(),
  }),
  /** Hours before appointment for day-before reminder (default 24 → evening prior). */
  remindHoursBefore: z.number().int().min(2).max(72),
  /** Local IST HH:MM for day-before reminder send (default 17:00). */
  remindAtLocal: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  quietStartLocal: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  quietEndLocal: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  smsDailyCap: z.number().int().min(1).max(200),
  otpReserve: z.number().int().min(0).max(50),
  dispatchPerTick: z.number().int().min(1).max(20),
  minLeadMinutes: z.number().int().min(30).max(360),
  recallPerDay: z.number().int().min(1).max(20),
  stopWords: z.array(z.string().trim().min(1).max(40)).max(20),
  duesIncludePaymentPending: z.boolean(),
});

export type MessagingSettings = z.infer<typeof messagingSettingsSchema>;

export const DEFAULT_MESSAGING_SETTINGS: MessagingSettings = {
  enabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  kinds: {
    confirm: true,
    remind: true,
    same_day_remind: false,
    reschedule: true,
    cancel: true,
    recall: true,
    incomplete: true,
    dues: true,
  },
  remindHoursBefore: 24,
  remindAtLocal: "17:00",
  quietStartLocal: "21:00",
  quietEndLocal: "08:00",
  smsDailyCap: 60,
  otpReserve: 10,
  dispatchPerTick: 5,
  minLeadMinutes: 120,
  recallPerDay: 5,
  stopWords: ["STOP", "STOPALL", "UNSUBSCRIBE"],
  duesIncludePaymentPending: true,
};

const templateBody = z.string().trim().min(1).max(500);

export const messageTemplatesSchema = z.object({
  draftBanner: z.string().min(1).max(80),
  templates: z.object({
    confirm: templateBody,
    remind: templateBody,
    reschedule: templateBody,
    cancel: templateBody,
    recall: templateBody,
    incomplete: templateBody,
    dues: templateBody,
    otp: templateBody,
  }),
});

export type MessageTemplates = z.infer<typeof messageTemplatesSchema>;

/** DRAFT - doctor to confirm (7.4.1). English only. No links, no clinical words. */
export const DRAFT_MESSAGE_TEMPLATES: MessageTemplates = {
  draftBanner: "DRAFT - doctor to confirm",
  templates: {
    confirm:
      "Dear {naam}, your appointment at {clinic} is booked for {din} {tareekh}, {samay}. To change it, call {fone}.",
    remind:
      "Dear {naam}, a reminder of your appointment at {clinic} tomorrow at {samay}. To change it, call {fone}.",
    reschedule:
      "Dear {naam}, your appointment at {clinic} is now on {din} {tareekh}, {samay}. Questions? Call {fone}.",
    cancel:
      "Dear {naam}, your appointment at {clinic} on {din} {tareekh}, {samay} is cancelled. To rebook, call {fone}.",
    recall: "Dear {naam}, this is {clinic}. It is time for your next visit. To book, call {fone}.",
    incomplete:
      "Dear {naam}, this is {clinic}. It is time for your next visit. To book, call {fone}.",
    dues: "Dear {naam}, this is {clinic}. A payment is pending. Please call {fone} to arrange.",
    otp: "{otp} is your {clinic} login code. It expires in 5 minutes. Do not share it.",
  },
};

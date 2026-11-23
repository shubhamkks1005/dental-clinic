import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { MESSAGE_CHANNELS, MESSAGE_KINDS, MESSAGE_STATUSES } from "@clinic/shared";
import { oneOf, standardColumns } from "./columns";

/** 7.2.1 message outbox (owner: also the messages log for wa.me opens). */
export const messageOutbox = sqliteTable(
  "message_outbox",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    appointmentId: text("appointment_id"),
    kind: text("kind", { enum: MESSAGE_KINDS }).notNull(),
    channel: text("channel", { enum: MESSAGE_CHANNELS }).notNull(),
    templateKey: text("template_key").notNull(),
    lang: text("lang").notNull().default("en"),
    paramsJson: text("params_json").notNull(),
    body: text("body").notNull().default(""),
    segments: integer("segments").notNull().default(1),
    status: text("status", { enum: MESSAGE_STATUSES }).notNull(),
    priority: integer("priority").notNull().default(100),
    dedupeKey: text("dedupe_key").notNull(),
    groupKey: text("group_key"),
    fallbackOf: text("fallback_of"),
    sendAfter: text("send_after").notNull(),
    expireAt: text("expire_at").notNull(),
    claimedAt: text("claimed_at"),
    attempts: integer("attempts").notNull().default(0),
    providerId: text("provider_id"),
    lastErrorCode: text("last_error_code"),
    skipReason: text("skip_reason"),
  },
  (t) => [
    uniqueIndex("message_outbox_dedupe_uq").on(t.dedupeKey),
    index("message_outbox_status_send_idx").on(t.status, t.sendAfter),
    index("message_outbox_appointment_idx").on(t.appointmentId),
    index("message_outbox_patient_created_idx").on(t.patientId, t.createdAt),
    index("message_outbox_provider_idx").on(t.providerId),
    check("message_outbox_kind_check", oneOf(t.kind.name, MESSAGE_KINDS)),
    check("message_outbox_channel_check", oneOf(t.channel.name, MESSAGE_CHANNELS)),
    check("message_outbox_status_check", oneOf(t.status.name, MESSAGE_STATUSES)),
    check("message_outbox_segments_pos", sql.raw(`"segments" >= 0`)),
    check("message_outbox_attempts_pos", sql.raw(`"attempts" >= 0`)),
  ],
);

export const messageAttempts = sqliteTable(
  "message_attempts",
  {
    ...standardColumns(),
    outboxId: text("outbox_id").notNull(),
    attemptNo: integer("attempt_no").notNull(),
    at: text("at").notNull(),
    adapter: text("adapter").notNull(),
    result: text("result").notNull(),
    httpStatus: integer("http_status"),
    errorCode: text("error_code"),
  },
  (t) => [
    index("message_attempts_outbox_idx").on(t.outboxId, t.attemptNo),
    check("message_attempts_no_pos", sql.raw(`"attempt_no" >= 1`)),
  ],
);

export const channelState = sqliteTable(
  "channel_state",
  {
    ...standardColumns(),
    channel: text("channel", { enum: MESSAGE_CHANNELS }).notNull(),
    lastPingAt: text("last_ping_at"),
    lastOkAt: text("last_ok_at"),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    state: text("state").notNull().default("ok"),
    note: text("note"),
  },
  (t) => [
    uniqueIndex("channel_state_channel_uq").on(t.channel),
    check("channel_state_channel_check", oneOf(t.channel.name, MESSAGE_CHANNELS)),
    check("channel_state_failures_pos", sql.raw(`"consecutive_failures" >= 0`)),
  ],
);

export const phoneFlags = sqliteTable(
  "phone_flags",
  {
    ...standardColumns(),
    phone: text("phone").notNull(),
    flag: text("flag").notNull(),
    source: text("source").notNull(),
  },
  (t) => [
    index("phone_flags_phone_idx").on(t.phone, t.flag),
    check(
      "phone_flags_flag_check",
      sql.raw(`"flag" IN ('opted_out','wrong_number','no_whatsapp','landline')`),
    ),
  ],
);

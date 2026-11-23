import {
  newUlid,
  type MessageChannelKind,
  type MessageKind,
  type MessageStatus,
} from "@clinic/shared";
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { messageAttempts, messageOutbox } from "../schema";
import { nowUtcSql } from "../sql";

export type EnqueueMessageInput = {
  patientId: string;
  appointmentId?: string | null;
  kind: MessageKind;
  channel: MessageChannelKind;
  templateKey: string;
  lang?: string;
  params: Record<string, string>;
  body: string;
  segments: number;
  status: MessageStatus;
  priority?: number;
  dedupeKey: string;
  groupKey?: string | null;
  fallbackOf?: string | null;
  sendAfter: string;
  expireAt: string;
  skipReason?: string | null;
  /** Human actions (open WhatsApp, cancel) write audit; planner system ticks may skip. */
  audit?: boolean;
};

export type OutboxRow = typeof messageOutbox.$inferSelect;

const BOARD_QUEUES = {
  outgoing: ["queued", "held"] as MessageStatus[],
  sent_today: [
    "sent",
    "delivered",
    "dry_run",
    "opened_in_whatsapp",
    "done_manual",
  ] as MessageStatus[],
  attention: ["failed", "unknown", "expired", "skipped"] as MessageStatus[],
  whatsapp: ["needs_human"] as MessageStatus[],
};

export function messagesOutboxRepo(db: Db, ctx: Ctx) {
  return {
    async enqueue(input: EnqueueMessageInput): Promise<{ id: string; created: boolean }> {
      assertAllowed(ctx, "appointments.manage");
      const id = newUlid();
      const row = {
        id,
        patientId: input.patientId,
        appointmentId: input.appointmentId ?? null,
        kind: input.kind,
        channel: input.channel,
        templateKey: input.templateKey,
        lang: input.lang ?? "en",
        paramsJson: JSON.stringify(input.params),
        body: input.body,
        segments: input.segments,
        status: input.status,
        priority: input.priority ?? 100,
        dedupeKey: input.dedupeKey,
        groupKey: input.groupKey ?? null,
        fallbackOf: input.fallbackOf ?? null,
        sendAfter: input.sendAfter,
        expireAt: input.expireAt,
        skipReason: input.skipReason ?? null,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      };
      try {
        const stmts = [
          db.insert(messageOutbox).values(row),
          ...(input.audit !== false
            ? [
                auditInsert(db, ctx, {
                  action: "create",
                  table: "message_outbox",
                  rowId: id,
                  after: {
                    patientId: input.patientId,
                    kind: input.kind,
                    channel: input.channel,
                    templateKey: input.templateKey,
                    status: input.status,
                    dedupeKey: input.dedupeKey,
                  },
                }),
              ]
            : []),
        ];
        await db.batch(stmts as [(typeof stmts)[0], ...typeof stmts]);
        return { id, created: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/UNIQUE|unique/i.test(msg)) {
          const existing = await db
            .select({ id: messageOutbox.id })
            .from(messageOutbox)
            .where(eq(messageOutbox.dedupeKey, input.dedupeKey))
            .get();
          if (existing) return { id: existing.id, created: false };
          throw new ConflictError("That message is already queued.");
        }
        throw err;
      }
    },

    async get(id: string): Promise<OutboxRow> {
      assertAllowed(ctx, "patients.view");
      const row = await db
        .select()
        .from(messageOutbox)
        .where(and(eq(messageOutbox.id, id), isNull(messageOutbox.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That message");
      return row;
    },

    async listForPatient(patientId: string, limit = 50): Promise<OutboxRow[]> {
      assertAllowed(ctx, "patients.view");
      return db
        .select()
        .from(messageOutbox)
        .where(and(eq(messageOutbox.patientId, patientId), isNull(messageOutbox.deletedAt)))
        .orderBy(desc(messageOutbox.createdAt))
        .limit(limit)
        .all();
    },

    async listBoard(bucket: keyof typeof BOARD_QUEUES, limit = 100): Promise<OutboxRow[]> {
      assertAllowed(ctx, "patients.view");
      return db
        .select()
        .from(messageOutbox)
        .where(
          and(inArray(messageOutbox.status, BOARD_QUEUES[bucket]), isNull(messageOutbox.deletedAt)),
        )
        .orderBy(asc(messageOutbox.sendAfter), asc(messageOutbox.priority))
        .limit(limit)
        .all();
    },

    async cancelQueuedForPatient(patientId: string, reason: string): Promise<number> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select({
          id: messageOutbox.id,
          status: messageOutbox.status,
          version: messageOutbox.version,
        })
        .from(messageOutbox)
        .where(
          and(
            eq(messageOutbox.patientId, patientId),
            inArray(messageOutbox.status, ["queued", "held", "needs_human"]),
            isNull(messageOutbox.deletedAt),
          ),
        )
        .all();
      if (rows.length === 0) return 0;
      const stmts = rows.flatMap((r) => [
        db
          .update(messageOutbox)
          .set({
            status: "cancelled",
            skipReason: reason,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
            version: sql`${messageOutbox.version} + 1`,
          })
          .where(and(eq(messageOutbox.id, r.id), eq(messageOutbox.version, r.version))),
        auditInsert(db, ctx, {
          action: "update",
          table: "message_outbox",
          rowId: r.id,
          before: { status: r.status },
          after: { status: "cancelled", reason },
        }),
      ]);
      await db.batch(stmts as [(typeof stmts)[0], ...typeof stmts]);
      return rows.length;
    },

    async cancelQueuedForAppointment(appointmentId: string, reason: string): Promise<number> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select({
          id: messageOutbox.id,
          status: messageOutbox.status,
          version: messageOutbox.version,
        })
        .from(messageOutbox)
        .where(
          and(
            eq(messageOutbox.appointmentId, appointmentId),
            inArray(messageOutbox.status, ["queued", "held", "needs_human"]),
            isNull(messageOutbox.deletedAt),
          ),
        )
        .all();
      if (rows.length === 0) return 0;
      const stmts = rows.flatMap((r) => [
        db
          .update(messageOutbox)
          .set({
            status: "cancelled",
            skipReason: reason,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
            version: sql`${messageOutbox.version} + 1`,
          })
          .where(and(eq(messageOutbox.id, r.id), eq(messageOutbox.version, r.version))),
        auditInsert(db, ctx, {
          action: "update",
          table: "message_outbox",
          rowId: r.id,
          before: { status: r.status },
          after: { status: "cancelled", reason },
        }),
      ]);
      await db.batch(stmts as [(typeof stmts)[0], ...typeof stmts]);
      return rows.length;
    },

    async markOpenedInWhatsApp(id: string): Promise<OutboxRow> {
      assertAllowed(ctx, "appointments.manage");
      const row = await this.get(id);
      if (!["needs_human", "queued", "held", "dry_run", "failed", "expired"].includes(row.status)) {
        throw new ConflictError("This message cannot be opened in WhatsApp now.");
      }
      const updated = await db
        .update(messageOutbox)
        .set({
          status: "opened_in_whatsapp",
          channel: "whatsapp_manual",
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
          version: sql`${messageOutbox.version} + 1`,
        })
        .where(and(eq(messageOutbox.id, id), eq(messageOutbox.version, row.version)))
        .returning()
        .get();
      if (!updated)
        throw new ConflictError("Someone else updated this message. Refresh and try again.");
      await db.batch([
        auditInsert(db, ctx, {
          action: "update",
          table: "message_outbox",
          rowId: id,
          before: { status: row.status },
          after: { status: "opened_in_whatsapp" },
        }),
      ]);
      return updated;
    },

    async markDoneManual(id: string): Promise<OutboxRow> {
      assertAllowed(ctx, "appointments.manage");
      const row = await this.get(id);
      if (row.status !== "opened_in_whatsapp" && row.status !== "needs_human") {
        throw new ConflictError("Mark sent only after opening WhatsApp.");
      }
      const updated = await db
        .update(messageOutbox)
        .set({
          status: "done_manual",
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
          version: sql`${messageOutbox.version} + 1`,
        })
        .where(and(eq(messageOutbox.id, id), eq(messageOutbox.version, row.version)))
        .returning()
        .get();
      if (!updated)
        throw new ConflictError("Someone else updated this message. Refresh and try again.");
      await db.batch([
        auditInsert(db, ctx, {
          action: "update",
          table: "message_outbox",
          rowId: id,
          before: { status: row.status },
          after: { status: "done_manual" },
        }),
      ]);
      return updated;
    },

    async setStatus(
      id: string,
      status: MessageStatus,
      extra?: {
        lastErrorCode?: string | null;
        providerId?: string | null;
        claimedAt?: string | null;
      },
    ): Promise<void> {
      assertAllowed(ctx, "appointments.manage");
      await db
        .update(messageOutbox)
        .set({
          status,
          lastErrorCode: extra?.lastErrorCode ?? null,
          providerId: extra?.providerId ?? undefined,
          claimedAt: extra?.claimedAt === undefined ? undefined : extra.claimedAt,
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
          version: sql`${messageOutbox.version} + 1`,
        })
        .where(and(eq(messageOutbox.id, id), isNull(messageOutbox.deletedAt)))
        .run();
    },

    /** Claim due queued/held rows for dispatcher (status → sending). */
    async claimDue(nowIso: string, limit: number): Promise<OutboxRow[]> {
      assertAllowed(ctx, "appointments.manage");
      const due = await db
        .select()
        .from(messageOutbox)
        .where(
          and(
            inArray(messageOutbox.status, ["queued", "held"]),
            lte(messageOutbox.sendAfter, nowIso),
            gte(messageOutbox.expireAt, nowIso),
            isNull(messageOutbox.deletedAt),
          ),
        )
        .orderBy(asc(messageOutbox.priority), asc(messageOutbox.sendAfter))
        .limit(limit)
        .all();
      const claimed: OutboxRow[] = [];
      for (const row of due) {
        const updated = await db
          .update(messageOutbox)
          .set({
            status: "sending",
            claimedAt: nowIso,
            attempts: sql`${messageOutbox.attempts} + 1`,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
            version: sql`${messageOutbox.version} + 1`,
          })
          .where(
            and(
              eq(messageOutbox.id, row.id),
              eq(messageOutbox.version, row.version),
              inArray(messageOutbox.status, ["queued", "held"]),
            ),
          )
          .returning()
          .get();
        if (updated) claimed.push(updated);
      }
      return claimed;
    },

    async recordAttempt(input: {
      outboxId: string;
      attemptNo: number;
      at: string;
      adapter: string;
      result: string;
      httpStatus?: number | null;
      errorCode?: string | null;
    }): Promise<void> {
      assertAllowed(ctx, "appointments.manage");
      await db
        .insert(messageAttempts)
        .values({
          id: newUlid(),
          outboxId: input.outboxId,
          attemptNo: input.attemptNo,
          at: input.at,
          adapter: input.adapter,
          result: input.result,
          httpStatus: input.httpStatus ?? null,
          errorCode: input.errorCode ?? null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        })
        .run();
    },

    async convertQueuedSmsToWhatsApp(): Promise<number> {
      assertAllowed(ctx, "appointments.manage");
      const rows = await db
        .select()
        .from(messageOutbox)
        .where(
          and(
            eq(messageOutbox.channel, "sms"),
            inArray(messageOutbox.status, ["queued", "held"]),
            isNull(messageOutbox.deletedAt),
          ),
        )
        .all();
      if (rows.length === 0) return 0;
      const stmts = rows.flatMap((r) => [
        db
          .update(messageOutbox)
          .set({
            channel: "whatsapp_manual",
            status: "needs_human",
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
            version: sql`${messageOutbox.version} + 1`,
          })
          .where(eq(messageOutbox.id, r.id)),
        auditInsert(db, ctx, {
          action: "update",
          table: "message_outbox",
          rowId: r.id,
          before: { channel: r.channel, status: r.status },
          after: { channel: "whatsapp_manual", status: "needs_human" },
        }),
      ]);
      await db.batch(stmts as [(typeof stmts)[0], ...typeof stmts]);
      return rows.length;
    },
  };
}

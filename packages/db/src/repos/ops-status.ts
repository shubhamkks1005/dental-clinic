import { newUlid } from "@clinic/shared";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import {
  OPS_STATUS_KEYS,
  type OpsStatusKey,
  type OpsStatusValue,
  opsStatus,
} from "../schema/ops-status";
import { nowUtcSql } from "../sql";

export type OpsStatusRow = {
  key: OpsStatusKey;
  status: OpsStatusValue;
  detail: Record<string, unknown>;
  checkedAt: string;
};

function parseDetail(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function scrubDetail(detail: Record<string, unknown>): Record<string, unknown> {
  const out = { ...detail };
  for (const k of Object.keys(out)) {
    if (/name|mobile|diagnos|patient|otp/i.test(k)) delete out[k];
  }
  return out;
}

/** Webhook/system upserts; staff reads via dashboard (no PHI). */
export function opsStatusRepo(db: Db, ctx: Ctx) {
  return {
    async list(): Promise<OpsStatusRow[]> {
      const rows = await db.select().from(opsStatus).all();
      return rows.map((r) => ({
        key: r.key as OpsStatusKey,
        status: r.status as OpsStatusValue,
        detail: parseDetail(r.detailJson),
        checkedAt: r.checkedAt,
      }));
    },

    async upsert(input: {
      key: OpsStatusKey;
      status: OpsStatusValue;
      detail?: Record<string, unknown>;
      checkedAt: string;
      actorId?: string;
    }): Promise<OpsStatusRow> {
      if (!OPS_STATUS_KEYS.includes(input.key)) {
        throw new Error("unknown ops key");
      }
      const actor = input.actorId ?? ctx.userId;
      const detail = scrubDetail(input.detail ?? {});
      const detailJson = JSON.stringify(detail);
      const existing = await db.select().from(opsStatus).where(eq(opsStatus.key, input.key)).get();

      if (existing) {
        await db
          .update(opsStatus)
          .set({
            status: input.status,
            detailJson,
            checkedAt: input.checkedAt,
            updatedAt: nowUtcSql,
            updatedBy: actor,
            version: sql`${opsStatus.version} + 1`,
          })
          .where(eq(opsStatus.id, existing.id))
          .run();
      } else {
        await db
          .insert(opsStatus)
          .values({
            id: newUlid(),
            createdBy: actor,
            updatedBy: actor,
            key: input.key,
            status: input.status,
            detailJson,
            checkedAt: input.checkedAt,
          })
          .run();
      }

      return { key: input.key, status: input.status, detail, checkedAt: input.checkedAt };
    },
  };
}

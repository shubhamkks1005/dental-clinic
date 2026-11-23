import { newUlid } from "@clinic/shared";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { errorLog } from "../schema/error-log";

const BANNED = /name|mobile|diagnos|patient|otp|phone|email/i;
// Limits per signed-in user. Together with the 30-day purge (docs/RETENTION.md) they cap growth.
export const ERROR_REPORTS_PER_MINUTE = 5;
export const ERROR_REPORTS_PER_DAY = 100;
export const ERROR_LIST_LIMIT = 100;

type Input = {
  source: "server" | "browser";
  kind: string;
  message: string;
  path?: string | null;
  requestId?: string | null;
  appVersion?: string | null;
};

export type ErrorLogRow = {
  id: string;
  createdAt: string;
  source: string;
  kind: string;
  message: string;
  path: string | null;
  requestId: string | null;
  appVersion: string | null;
  role: string | null;
};

/** Strip anything that could identify a person, whatever the caller sent. */
export function scrubErrorMessage(text: string): string {
  const cleaned = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[removed]")
    .replace(/\d{4,}/g, "#")
    .slice(0, 200);
  return BANNED.test(cleaned) ? "Redacted error (possible personal data)." : cleaned;
}

/** Record ids in a screen path never reach the log (/app/patients/<id> -> /app/patients/:id). */
export function scrubErrorPath(path: string | null | undefined): string | null {
  if (!path?.startsWith("/")) return null;
  return path
    .split("?")[0]!
    .split("/")
    .map((seg) => (/^[0-9A-Za-z-]{16,}$/.test(seg) ? ":id" : seg))
    .join("/")
    .slice(0, 200);
}

/** 9.2.5: error rows; message scrubbed; rate limited per user (route also caps the body size). */
export function errorLogRepo(db: Db, ctx: Ctx) {
  async function write(input: Input) {
    const kind = input.kind.replace(BANNED, "redacted").slice(0, 80);
    await db
      .insert(errorLog)
      .values({
        id: newUlid(),
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
        source: input.source,
        kind,
        message: scrubErrorMessage(input.message),
        path: scrubErrorPath(input.path),
        requestId: input.requestId?.slice(0, 64) ?? null,
        appVersion: input.appVersion?.slice(0, 40) ?? null,
        role: ctx.role,
      })
      .run();
  }

  async function countSince(since: Date): Promise<number> {
    const row = await db
      .select({ n: sql<number>`count(*)` })
      .from(errorLog)
      .where(and(eq(errorLog.createdBy, ctx.userId), gte(errorLog.createdAt, since.toISOString())))
      .get();
    return row?.n ?? 0;
  }

  return {
    /** Server and jobs write here (no per-user limit). */
    insert: write,

    /** Browser report from a signed-in user. Returns "limited" when over the per-user caps. */
    async report(input: Input, now: Date = new Date()): Promise<"stored" | "limited"> {
      if ((await countSince(new Date(now.getTime() - 60_000))) >= ERROR_REPORTS_PER_MINUTE) {
        return "limited";
      }
      if ((await countSince(new Date(now.getTime() - 86_400_000))) >= ERROR_REPORTS_PER_DAY) {
        return "limited";
      }
      await write(input);
      return "stored";
    },

    /** Doctor only, newest first, read only. */
    async list(): Promise<ErrorLogRow[]> {
      assertAllowed(ctx, "errors.view");
      return db
        .select({
          id: errorLog.id,
          createdAt: errorLog.createdAt,
          source: errorLog.source,
          kind: errorLog.kind,
          message: errorLog.message,
          path: errorLog.path,
          requestId: errorLog.requestId,
          appVersion: errorLog.appVersion,
          role: errorLog.role,
        })
        .from(errorLog)
        .where(isNull(errorLog.deletedAt))
        .orderBy(desc(errorLog.createdAt))
        .limit(ERROR_LIST_LIMIT)
        .all();
    },
  };
}

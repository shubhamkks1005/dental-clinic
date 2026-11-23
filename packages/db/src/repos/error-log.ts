import { newUlid } from "@clinic/shared";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { errorLog } from "../schema/error-log";

const BANNED = /name|mobile|diagnos|patient|otp|phone|email/i;

/** 9.2.5: append-only error rows; message scrubbed. Rate limit is in the route. */
export function errorLogRepo(db: Db, ctx: Ctx) {
  return {
    async insert(input: {
      source: "server" | "browser";
      kind: string;
      message: string;
      path?: string | null;
      requestId?: string | null;
    }) {
      const kind = input.kind.replace(BANNED, "redacted").slice(0, 80);
      let message = input.message.slice(0, 400);
      if (BANNED.test(message)) message = "Redacted error (possible personal data).";
      const path = input.path?.startsWith("/") ? input.path.slice(0, 200) : null;
      await db
        .insert(errorLog)
        .values({
          id: newUlid(),
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          source: input.source,
          kind,
          message,
          path,
          requestId: input.requestId?.slice(0, 64) ?? null,
        })
        .run();
    },
  };
}

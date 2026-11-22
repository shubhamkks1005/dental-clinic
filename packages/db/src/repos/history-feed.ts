import { decodeHistoryCursor, HISTORY_FEED_PAGE_SIZE, type HistoryCursor } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { accessInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";
import { appointmentHistorySource } from "./history-feed-appointments";
import { mergeHistorySources } from "./history-feed-merge";
import type { HistoryFeedPage, HistorySource } from "./history-feed-types";
import { visitHistorySource } from "./history-feed-visits";

function emptySource(): HistorySource {
  return {
    async list() {
      return [];
    },
  };
}

// 3.5.12: merged feed. Stage-1 extras (treatments/files/medical/consents) land in 3.5.13.
export function historyFeedRepo(db: Db, ctx: Ctx) {
  const sources: HistorySource[] = [
    appointmentHistorySource(db),
    visitHistorySource(db),
    emptySource(), // treatment — 3.5.13
    emptySource(), // file — 3.5.13 / 3.7
    emptySource(), // medical_change — 3.5.13
    emptySource(), // consent — 3.5.13
  ];

  return {
    async listFeed(
      patientId: string,
      opts?: { cursor?: string | null; limit?: number },
    ): Promise<HistoryFeedPage> {
      assertAllowed(ctx, "patients.view");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      let after: HistoryCursor | null = null;
      if (opts?.cursor) {
        after = decodeHistoryCursor(opts.cursor);
        if (!after) {
          throw new InvalidError("That history page link is not valid. Reload and try again.");
        }
      }

      const page = await mergeHistorySources(sources, {
        patientId,
        limit: opts?.limit ?? HISTORY_FEED_PAGE_SIZE,
        after,
      });

      await accessInsert(db, ctx, {
        action: "view",
        resource: "patient_history",
        resourceId: patientId,
        detail: after ? "history feed page" : "history feed",
      });

      return page;
    },
  };
}

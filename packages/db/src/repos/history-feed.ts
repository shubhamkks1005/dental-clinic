import {
  decodeHistoryCursor,
  HISTORY_FEED_PAGE_SIZE,
  resolveHistoryFeedFilters,
  type HistoryCursor,
  type HistoryFeedQuery,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { accessInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { patients } from "../schema";
import { amendmentHistorySource } from "./history-feed-amendments";
import { appointmentHistorySource } from "./history-feed-appointments";
import { consentHistorySource } from "./history-feed-consents";
import { fileHistorySource } from "./history-feed-files";
import { mergeHistorySources } from "./history-feed-merge";
import { medicalChangeHistorySource } from "./history-feed-medical";
import type { HistoryFeedPage, HistorySource } from "./history-feed-types";
import { historyFileKindsForRole } from "./history-feed-visibility";
import { treatmentHistorySource } from "./history-feed-treatments";
import { visitHistorySource } from "./history-feed-visits";
import { prescriptionHistorySource } from "./history-feed-prescriptions";
import { certificateHistorySource } from "./history-feed-certificates";
import { billHistorySource, paymentHistorySource, refundHistorySource } from "./history-feed-bills";
import { pastRecordHistorySource } from "./history-feed-past-records";

function sourcesForCtx(db: Db, ctx: Ctx): HistorySource[] {
  const fileKinds = historyFileKindsForRole(ctx.role);
  const base: HistorySource[] = [
    appointmentHistorySource(db),
    consentHistorySource(db),
    fileHistorySource(db, { kinds: fileKinds }),
  ];
  // 5.3.16: receptionist and doctor both see bills/payments/refunds (money, not clinical notes).
  if (isAllowed(ctx.role, "bills.create")) {
    base.push(billHistorySource(db), paymentHistorySource(db), refundHistorySource(db));
  }
  if (isAllowed(ctx.role, "prescriptions.print") && !isAllowed(ctx.role, "clinical.view")) {
    base.push(prescriptionHistorySource(db, { includeMedicines: false }));
  }
  if (isAllowed(ctx.role, "certificates.print") && !isAllowed(ctx.role, "clinical.view")) {
    base.push(certificateHistorySource(db, { includeClinical: false }));
  }
  if (!isAllowed(ctx.role, "clinical.view")) return base;
  return [
    ...base,
    visitHistorySource(db),
    treatmentHistorySource(db),
    medicalChangeHistorySource(db),
    amendmentHistorySource(db),
    prescriptionHistorySource(db, { includeMedicines: true }),
    certificateHistorySource(db, { includeClinical: true }),
    pastRecordHistorySource(db),
  ];
}

function sourcesMatchingTypes(
  sources: HistorySource[],
  types: readonly string[] | null,
): HistorySource[] {
  if (!types) return sources;
  const want = new Set(types);
  return sources.filter((s) => s.types.some((t) => want.has(t)));
}

// 3.5.12–3.5.14 / 6.7.1: merged feed; receptionist sources exclude clinical types (API filter).
export function historyFeedRepo(db: Db, ctx: Ctx) {
  const sources = sourcesForCtx(db, ctx);

  return {
    async listFeed(
      patientId: string,
      opts?: { cursor?: string | null; limit?: number } & Partial<HistoryFeedQuery>,
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

      const filters = resolveHistoryFeedFilters({
        chip: opts?.chip,
        from: opts?.from,
        to: opts?.to,
        tooth: opts?.tooth,
        q: opts?.q,
      });

      // Empty type intersection (e.g. Bills chip + tooth) → no sources.
      if (filters.types && filters.types.length === 0) {
        await accessInsert(db, ctx, {
          action: "view",
          resource: "patient_history",
          resourceId: patientId,
          detail: after ? "history feed page" : "history feed",
        });
        return { entries: [], nextCursor: null };
      }

      const page = await mergeHistorySources(sourcesMatchingTypes(sources, filters.types), {
        patientId,
        limit: opts?.limit ?? HISTORY_FEED_PAGE_SIZE,
        after,
        filters,
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

import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { appointments } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(appointments.startAt, after.at),
    and(eq(appointments.startAt, after.at), lt(appointments.id, after.id)),
  );
}

export function appointmentHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: appointments.id,
          startAt: appointments.startAt,
          dateLocal: appointments.dateLocal,
          status: appointments.status,
          visitTypeLabel: appointments.visitTypeLabel,
          cancelReason: appointments.cancelReason,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, q.patientId),
            isNull(appointments.deletedAt),
            afterClause(q.after),
          ),
        )
        .orderBy(desc(appointments.startAt), desc(appointments.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const reason = r.cancelReason?.trim();
        const summary =
          r.status === "rescheduled"
            ? `${r.visitTypeLabel} · moved`
            : reason
              ? `${r.visitTypeLabel} · ${r.status} · ${reason}`
              : `${r.visitTypeLabel} · ${r.status}`;
        return {
          id: r.id,
          type: "appointment" as const,
          at: r.startAt,
          summary,
          actorName: null,
          status: r.status,
          href: `/app/appointments?date=${encodeURIComponent(r.dateLocal)}`,
        };
      });
    },
  };
}

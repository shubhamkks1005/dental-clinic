import { and, asc, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { prescriptionItems, prescriptions, users } from "../schema";
import { historyAtBounds } from "./history-feed-bounds";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterClause(after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(
    lt(prescriptions.issuedAt, after.at),
    and(eq(prescriptions.issuedAt, after.at), lt(prescriptions.id, after.id)),
  );
}

/**
 * 4.2.8: issued/revised prescriptions in History.
 * `includeMedicines` false for receptionist (print path only — no clinical Rx detail).
 */
export function prescriptionHistorySource(
  db: Db,
  opts: { includeMedicines: boolean },
): HistorySource {
  return {
    types: ["prescription"],
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: prescriptions.id,
          issuedAt: prescriptions.issuedAt,
          createdAt: prescriptions.createdAt,
          status: prescriptions.status,
          rxNo: prescriptions.rxNo,
          doctorName: users.name,
        })
        .from(prescriptions)
        .leftJoin(users, eq(users.id, prescriptions.doctorId))
        .where(
          and(
            eq(prescriptions.patientId, q.patientId),
            isNull(prescriptions.deletedAt),
            inArray(prescriptions.status, ["issued", "revised"]),
            afterClause(q.after),
            historyAtBounds(prescriptions.issuedAt, q.filters),
          ),
        )
        .orderBy(desc(prescriptions.issuedAt), desc(prescriptions.id))
        .limit(q.take)
        .all();

      const medsByRx = new Map<string, string[]>();
      if (opts.includeMedicines && rows.length > 0) {
        const itemRows = await db
          .select({
            prescriptionId: prescriptionItems.prescriptionId,
            genericName: prescriptionItems.genericName,
            sortOrder: prescriptionItems.sortOrder,
          })
          .from(prescriptionItems)
          .where(
            and(
              inArray(
                prescriptionItems.prescriptionId,
                rows.map((r) => r.id),
              ),
              isNull(prescriptionItems.deletedAt),
            ),
          )
          .orderBy(asc(prescriptionItems.sortOrder))
          .all();
        for (const item of itemRows) {
          const list = medsByRx.get(item.prescriptionId) ?? [];
          list.push(item.genericName);
          medsByRx.set(item.prescriptionId, list);
        }
      }

      return rows.map((r) => {
        const at = r.issuedAt ?? r.createdAt;
        const rxLabel = r.rxNo ?? "Prescription";
        const meds = medsByRx.get(r.id);
        const summary =
          opts.includeMedicines && meds && meds.length > 0
            ? `${rxLabel}: ${meds.slice(0, 4).join(", ")}${meds.length > 4 ? "…" : ""}`
            : rxLabel;
        return {
          id: r.id,
          type: "prescription" as const,
          at,
          summary,
          actorName: r.doctorName ?? null,
          status: r.status,
          href: `/app/print/prescription/${r.id}`,
        };
      });
    },
  };
}

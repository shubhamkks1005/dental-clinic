import {
  addIstDays,
  findFreeSlots,
  istDate,
  istLocalToUtc,
  slotSearchEarliest,
  visitTypeSnapshot,
  type FreeSlot,
  type Holiday,
  type ListItem,
  type Timings,
} from "@clinic/shared";
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments, listItems } from "../schema";

export type SuggestSlotsOptions = {
  timings: Timings;
  holidays: Holiday[];
  now: Date;
  /** Prefer slots on/after this IST day (defaults to today). */
  fromDate?: string;
  limit?: number;
};

async function loadVisitType(db: Db, id: string): Promise<ListItem> {
  const row = await db
    .select()
    .from(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.listKey, "visit_types"), isNull(listItems.deletedAt)),
    )
    .get();
  if (!row || !row.active) throw new NotFoundError("That visit type");
  return {
    id: row.id,
    label: row.label,
    data: JSON.parse(row.dataJson) as ListItem["data"],
    active: row.active,
    sortOrder: row.sortOrder,
    version: row.version,
  };
}

export function appointmentsSlotsRepo(db: Db, ctx: Ctx) {
  return {
    async suggestSlots(visitTypeId: string, opts: SuggestSlotsOptions): Promise<FreeSlot[]> {
      assertAllowed(ctx, "appointments.manage");
      if (!visitTypeId.trim()) throw new InvalidError("Choose a visit type.");
      const visit = await loadVisitType(db, visitTypeId);
      const snap = visitTypeSnapshot(visit, opts.timings.slotMinutes);
      const fromDate = opts.fromDate ?? istDate(opts.now);
      const dayStart = istLocalToUtc(fromDate, 0);
      const earliest =
        dayStart.getTime() > slotSearchEarliest(opts.now).getTime()
          ? dayStart
          : slotSearchEarliest(opts.now);
      const searchDays = 14;
      const endDate = addIstDays(fromDate, searchDays);
      const busy = await db
        .select({
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          endMin: appointments.endMin,
          status: appointments.status,
        })
        .from(appointments)
        .where(
          and(
            isNull(appointments.deletedAt),
            gte(appointments.dateLocal, fromDate),
            lte(appointments.dateLocal, endDate),
          ),
        )
        .all();
      return findFreeSlots({
        timings: opts.timings,
        holidays: opts.holidays,
        durationMin: snap.durationMin,
        earliest,
        busy,
        limit: opts.limit ?? 5,
      });
    },
  };
}

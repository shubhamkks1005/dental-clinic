import {
  addIstDays,
  findFreeSlots,
  istDate,
  istLocalToUtc,
  slotSearchEarliest,
  visitTypeSnapshot,
  type FreeSlot,
  type Holiday,
  type Timings,
} from "@clinic/shared";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { appointments } from "../schema";
import { loadVisitType } from "./visit-type-load";

export type SuggestSlotsOptions = {
  timings: Timings;
  holidays: Holiday[];
  now: Date;
  /** Prefer slots on/after this IST day (defaults to today). */
  fromDate?: string;
  limit?: number;
  /** How many days to look at, starting at fromDate (default 14; 1 = that day only). */
  searchDays?: number;
  /** Only this doctor's own chair (each doctor has their own chair). */
  doctorId?: string;
};

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
      const searchDays = opts.searchDays ?? 14;
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
            opts.doctorId
              ? or(eq(appointments.doctorId, opts.doctorId), isNull(appointments.doctorId))
              : undefined,
          ),
        )
        .all();
      const free = findFreeSlots({
        timings: opts.timings,
        holidays: opts.holidays,
        durationMin: snap.durationMin,
        earliest,
        busy,
        limit: opts.limit ?? 5,
        searchDays,
      });
      // One-day search for a past date would start today: show nothing instead.
      return searchDays === 1 ? free.filter((s) => s.dateLocal === fromDate) : free;
    },
  };
}

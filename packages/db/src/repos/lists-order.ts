import type { ListItem } from "@clinic/shared";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems } from "../schema";
import { nowUtcSql } from "../sql";
import type { listsCore } from "./lists-core";

type Core = ReturnType<typeof listsCore>;

// Order of a list. Only ACTIVE items take part (L1): hidden items keep their sort_order and are
// never swapped, so every move shows on screen.
export function listsOrder(db: Db, ctx: Ctx, core: Core) {
  /** Updates a row's place only when the moved row's update happened (same batch). */
  const follow = (id: string, sortOrder: number, movedId: string, movedVersion: number) =>
    db
      .update(listItems)
      .set({
        sortOrder,
        version: sql`${listItems.version} + 1`,
        updatedAt: nowUtcSql,
        updatedBy: ctx.userId,
      })
      .where(
        and(
          eq(listItems.id, id),
          sql`(SELECT version FROM list_items WHERE id = ${movedId}) = ${movedVersion + 1}`,
        ),
      );

  const moveRow = (id: string, version: number, to: number) =>
    db
      .update(listItems)
      .set({ sortOrder: to, version: version + 1, updatedAt: nowUtcSql, updatedBy: ctx.userId })
      .where(and(eq(listItems.id, id), eq(listItems.version, version)))
      .returning({ id: listItems.id });

  return {
    // Swap places with the active item above or below.
    async move(
      key: string,
      id: string,
      direction: "up" | "down",
      version: number,
    ): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = core.listKey(key);
      const row = await core.find(k, id, version);
      const up = direction === "up";
      const neighbour = await db
        .select()
        .from(listItems)
        .where(
          and(
            core.inList(k),
            eq(listItems.active, true),
            up ? lt(listItems.sortOrder, row.sortOrder) : gt(listItems.sortOrder, row.sortOrder),
          ),
        )
        .orderBy(up ? desc(listItems.sortOrder) : asc(listItems.sortOrder))
        .get();
      if (!neighbour) return core.itemsOf(k);
      const [moved] = await db.batch([
        moveRow(row.id, row.version, neighbour.sortOrder),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "list_items",
          rowId: row.id,
          before: { list: k, position: row.sortOrder },
          after: { list: k, position: neighbour.sortOrder },
        }),
        follow(neighbour.id, row.sortOrder, row.id, row.version),
      ]);
      if (moved.length === 0) throw new ConflictError();
      return core.itemsOf(k);
    },

    /** Drag and drop: put the item at a 1-based place among the ACTIVE items. */
    async moveTo(key: string, id: string, position: number, version: number): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = core.listKey(key);
      const row = await core.find(k, id, version);
      if (!row.active) throw new InvalidError("Show this item again before moving it.");
      const active = await db
        .select({ id: listItems.id, sortOrder: listItems.sortOrder })
        .from(listItems)
        .where(and(core.inList(k), eq(listItems.active, true)))
        .orderBy(asc(listItems.sortOrder), asc(listItems.label));
      if (!Number.isInteger(position) || position < 1 || position > active.length) {
        throw new InvalidError("Pick a place in the list.");
      }
      const from = active.findIndex((r) => r.id === row.id);
      const to = position - 1;
      if (from === to) return core.itemsOf(k);
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      // The rows between the old and new place swap among their own sort_order slots.
      const slots = active.slice(lo, hi + 1).map((r) => r.sortOrder);
      const order = active.map((r) => r.id);
      order.splice(from, 1);
      order.splice(to, 0, row.id);
      const placed = order.slice(lo, hi + 1).map((rid, i) => ({ id: rid, sortOrder: slots[i]! }));
      const mine = placed.find((p) => p.id === row.id)!;
      const others = placed.filter((p) => p.id !== row.id);
      const [moved] = await db.batch([
        moveRow(row.id, row.version, mine.sortOrder),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "list_items",
          rowId: row.id,
          before: { list: k, position: from + 1 },
          after: { list: k, position },
        }),
        ...others.map((p) => follow(p.id, p.sortOrder, row.id, row.version)),
      ]);
      if (moved.length === 0) throw new ConflictError();
      return core.itemsOf(k);
    },
  };
}

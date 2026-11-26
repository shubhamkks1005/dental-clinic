import {
  fillAsDirected,
  isSameListItem,
  newUlid,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { and, ne, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotAllowedError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems } from "../schema";
import { listsCore } from "./lists-core";
import { listsHide } from "./lists-hide";
import { listsOrder } from "./lists-order";

export { STARTER_LIST } from "./lists-core";
export type { HideMedicineResult } from "./lists-hide";

export const DUPLICATE_ITEM = "This is already in your list.";

// 1.5.4 editable lists. Read: settings.read (staff pick from them). Change: settings.write.
// Every change is version-checked and audited; items are hidden, never deleted.
// Library (2026-11-26): the same name may be saved twice when another field differs; only an
// exact duplicate (name and every field) is refused.
export function listsRepo(db: Db, ctx: Ctx) {
  const core = listsCore(db, ctx);

  /** Medicines save "As directed" in an empty usual dose, frequency, days and timing (Q8). */
  const stored = (key: ListKey, item: ListItemInput): ListItemInput =>
    key === "medicines" ? { ...item, data: fillAsDirected(item.data) } : item;

  async function refuseDuplicate(key: ListKey, item: ListItemInput, exceptId: string | null) {
    const same = sql`lower(${listItems.label}) = lower(${item.label})`;
    const where = exceptId
      ? and(core.inList(key), same, ne(listItems.id, exceptId))
      : and(core.inList(key), same);
    const rows = await db
      .select({ label: listItems.label, dataJson: listItems.dataJson })
      .from(listItems)
      .where(where);
    const twin = rows.some((r) =>
      isSameListItem(key, item, { label: r.label, data: JSON.parse(r.dataJson) }),
    );
    if (twin) throw new NotAllowedError(DUPLICATE_ITEM);
  }

  async function addWithId(
    key: string,
    input: unknown,
  ): Promise<{ items: ListItem[]; id: string }> {
    assertAllowed(ctx, "settings.write");
    const k = core.listKey(key);
    const item = stored(k, core.parse(k, input));
    await refuseDuplicate(k, item, null);
    const id = newUlid();
    await db.batch([
      db.insert(listItems).values({
        id,
        listKey: k,
        label: item.label,
        dataJson: JSON.stringify(item.data),
        active: true,
        sortOrder: sql`(SELECT COALESCE(MAX(sort_order), 0) + 1 FROM list_items WHERE list_key = ${k})`,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      }),
      auditInsert(db, ctx, {
        action: "create",
        table: "list_items",
        rowId: id,
        after: { list: k, ...item },
      }),
    ]);
    return { items: await core.itemsOf(k), id };
  }

  return {
    async list(key: string): Promise<ListItem[]> {
      // Q1.11 (D4): the medicine list is the doctor's own; the desk does not read it.
      assertAllowed(ctx, key === "medicines" ? "settings.medicines" : "settings.read");
      return core.itemsOf(core.listKey(key));
    },

    /** Adds at the end of the list; the reply names the new item by id (twins may exist). */
    addWithId,

    async add(key: string, input: unknown): Promise<ListItem[]> {
      return (await addWithId(key, input)).items;
    },

    async update(key: string, id: string, input: unknown, version: number): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = core.listKey(key);
      const item = stored(k, core.parse(k, input));
      const row = await core.find(k, id, version);
      await refuseDuplicate(k, item, id);
      await core.change(
        row,
        { label: item.label, dataJson: JSON.stringify(item.data) },
        { label: row.label, data: JSON.parse(row.dataJson) },
        item,
      );
      return core.itemsOf(k);
    },

    // Hidden items stay in old records but are no longer offered.
    async setActive(
      key: string,
      id: string,
      active: boolean,
      version: number,
    ): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = core.listKey(key);
      const row = await core.find(k, id, version);
      if (row.active !== active)
        await core.change(row, { active }, { active: row.active }, { active });
      return core.itemsOf(k);
    },

    ...listsOrder(db, ctx, core),
    ...listsHide(db, ctx, core),
  };
}

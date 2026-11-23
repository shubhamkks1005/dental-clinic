import {
  isListKey,
  listItemSchema,
  newUlid,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { and, asc, desc, eq, gt, isNull, lt, ne, sql, type SQL } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotAllowedError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems } from "../schema";
import { nowUtcSql } from "../sql";

type Row = typeof listItems.$inferSelect;

const toItem = (r: Row): ListItem => ({
  id: r.id,
  label: r.label,
  data: JSON.parse(r.dataJson) as ListItem["data"],
  active: r.active,
  sortOrder: r.sortOrder,
  version: r.version,
});

// 1.5.4 editable lists. Read: settings.read (staff pick from them). Change: settings.write.
// Every change is version-checked and audited; items are hidden, never deleted.
export function listsRepo(db: Db, ctx: Ctx) {
  const inList = (key: ListKey) => and(eq(listItems.listKey, key), isNull(listItems.deletedAt));

  async function itemsOf(key: ListKey): Promise<ListItem[]> {
    const rows = await db
      .select()
      .from(listItems)
      .where(inList(key))
      .orderBy(asc(listItems.sortOrder), asc(listItems.label));
    return rows.map(toItem);
  }

  function listKey(key: string): ListKey {
    if (!isListKey(key)) throw new NotFoundError(`The list "${key}"`);
    return key;
  }

  function parse(key: ListKey, input: unknown): ListItemInput {
    const result = listItemSchema(key).safeParse(input);
    if (!result.success)
      throw new InvalidError(result.error.issues[0]?.message ?? "Check the item.");
    return result.data as ListItemInput;
  }

  async function find(key: ListKey, id: string, version: number): Promise<Row> {
    const row = await db
      .select()
      .from(listItems)
      .where(and(inList(key), eq(listItems.id, id)))
      .get();
    if (!row) throw new NotFoundError("This item");
    if (row.version !== version) throw new ConflictError();
    return row;
  }

  async function refuseDuplicate(key: ListKey, label: string, exceptId: string | null) {
    const same = sql`lower(${listItems.label}) = lower(${label})`;
    const where = exceptId
      ? and(inList(key), same, ne(listItems.id, exceptId))
      : and(inList(key), same);
    if (await db.select({ id: listItems.id }).from(listItems).where(where).get()) {
      throw new NotAllowedError(`"${label}" is already in this list.`);
    }
  }

  // Version-checked UPDATE + audit row (only if the UPDATE happened) in one batch.
  async function change(row: Row, set: Partial<Row>, before: object, after: object, extra?: SQL) {
    const [updated] = await db.batch([
      db
        .update(listItems)
        .set({ ...set, version: row.version + 1, updatedAt: nowUtcSql, updatedBy: ctx.userId })
        .where(and(eq(listItems.id, row.id), eq(listItems.version, row.version), extra))
        .returning({ id: listItems.id }),
      auditInsertIfChanged(db, ctx, {
        action: "update",
        table: "list_items",
        rowId: row.id,
        before: { list: row.listKey, ...before },
        after: { list: row.listKey, ...after },
      }),
    ]);
    if (updated.length === 0) throw new ConflictError();
  }

  return {
    async list(key: string): Promise<ListItem[]> {
      // Q1.11 (D4): the medicine list is the doctor's own; the desk does not read it.
      assertAllowed(ctx, key === "medicines" ? "settings.medicines" : "settings.read");
      return itemsOf(listKey(key));
    },

    async add(key: string, input: unknown): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = listKey(key);
      const item = parse(k, input);
      await refuseDuplicate(k, item.label, null);
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
      return itemsOf(k);
    },

    async update(key: string, id: string, input: unknown, version: number): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = listKey(key);
      const item = parse(k, input);
      const row = await find(k, id, version);
      await refuseDuplicate(k, item.label, id);
      await change(
        row,
        { label: item.label, dataJson: JSON.stringify(item.data) },
        { label: row.label, data: JSON.parse(row.dataJson) },
        item,
      );
      return itemsOf(k);
    },

    // Hidden items stay in old records but are no longer offered.
    async setActive(
      key: string,
      id: string,
      active: boolean,
      version: number,
    ): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = listKey(key);
      const row = await find(k, id, version);
      if (row.active !== active) await change(row, { active }, { active: row.active }, { active });
      return itemsOf(k);
    },

    // Swap places with the item above or below.
    async move(
      key: string,
      id: string,
      direction: "up" | "down",
      version: number,
    ): Promise<ListItem[]> {
      assertAllowed(ctx, "settings.write");
      const k = listKey(key);
      const row = await find(k, id, version);
      const up = direction === "up";
      const neighbour = await db
        .select()
        .from(listItems)
        .where(
          and(
            inList(k),
            up ? lt(listItems.sortOrder, row.sortOrder) : gt(listItems.sortOrder, row.sortOrder),
          ),
        )
        .orderBy(up ? desc(listItems.sortOrder) : asc(listItems.sortOrder))
        .get();
      if (!neighbour) return itemsOf(k);
      await db.batch([
        db
          .update(listItems)
          .set({
            sortOrder: neighbour.sortOrder,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(listItems.id, row.id), eq(listItems.version, row.version))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "list_items",
          rowId: row.id,
          before: { list: k, position: row.sortOrder },
          after: { list: k, position: neighbour.sortOrder },
        }),
        db
          .update(listItems)
          .set({
            sortOrder: row.sortOrder,
            version: neighbour.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(listItems.id, neighbour.id),
              sql`(SELECT version FROM list_items WHERE id = ${row.id}) = ${row.version + 1}`,
            ),
          ),
      ]);
      return itemsOf(k);
    },
  };
}

import {
  isListKey,
  listItemSchema,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { and, asc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { listItems, users } from "../schema";
import { nowUtcSql } from "../sql";

export type ListRow = typeof listItems.$inferSelect;

/** Seeded rows were made by the system, not a person (L18). */
export const STARTER_LIST = "Starter list";
const SYSTEM = "system";
const IN_LIMIT = 90;

export function toItem(r: ListRow, names?: Map<string, string>): ListItem {
  const who = (id: string) => (id === SYSTEM ? STARTER_LIST : (names?.get(id) ?? "-"));
  return {
    id: r.id,
    label: r.label,
    data: JSON.parse(r.dataJson) as ListItem["data"],
    active: r.active,
    sortOrder: r.sortOrder,
    version: r.version,
    createdAt: r.createdAt,
    createdByName: who(r.createdBy),
    updatedAt: r.updatedAt,
    updatedByName: who(r.updatedBy),
  };
}

// Shared pieces of the lists repository (split so each file stays small).
export function listsCore(db: Db, ctx: Ctx) {
  const inList = (key: ListKey) => and(eq(listItems.listKey, key), isNull(listItems.deletedAt));

  /** Names of the people who made or changed the rows: one users read per 90 ids, in parallel. */
  async function namesOf(rows: readonly ListRow[]): Promise<Map<string, string>> {
    const ids = [...new Set(rows.flatMap((r) => [r.createdBy, r.updatedBy]))].filter(
      (id) => id !== SYSTEM,
    );
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += IN_LIMIT) chunks.push(ids.slice(i, i + IN_LIMIT));
    const found = await Promise.all(
      chunks.map((chunk) =>
        db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, chunk)),
      ),
    );
    return new Map(found.flat().map((u) => [u.id, u.name]));
  }

  async function itemsOf(key: ListKey): Promise<ListItem[]> {
    const rows = await db
      .select()
      .from(listItems)
      .where(inList(key))
      .orderBy(asc(listItems.sortOrder), asc(listItems.label));
    const names = await namesOf(rows);
    return rows.map((r) => toItem(r, names));
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

  async function find(key: ListKey, id: string, version: number): Promise<ListRow> {
    const row = await db
      .select()
      .from(listItems)
      .where(and(inList(key), eq(listItems.id, id)))
      .get();
    if (!row) throw new NotFoundError("This item");
    if (row.version !== version) throw new ConflictError();
    return row;
  }

  /** Version-checked UPDATE + audit row (only if the UPDATE happened), as batch statements. */
  function changeStatements(
    row: ListRow,
    set: Partial<ListRow>,
    before: object,
    after: object,
    extra?: SQL,
  ) {
    return [
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
    ] as const;
  }

  async function change(row: ListRow, set: Partial<ListRow>, before: object, after: object) {
    const [updated] = await db.batch(changeStatements(row, set, before, after));
    if (updated.length === 0) throw new ConflictError();
  }

  return { inList, itemsOf, listKey, parse, find, change, changeStatements };
}

import type { ListItem } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { InvalidError, NotFoundError } from "../errors";
import { listItems, patients } from "../schema";

/** One active visit type (book, move, walk-in and free slots all read it the same way). */
export async function loadVisitType(db: Db, id: string): Promise<ListItem> {
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

/** Only an active patient can be booked. */
export async function requireBookablePatient(db: Db, id: string): Promise<void> {
  const row = await db
    .select({ id: patients.id, status: patients.status })
    .from(patients)
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .get();
  if (!row) throw new NotFoundError("That patient");
  if (row.status !== "active") {
    throw new InvalidError("This patient is archived. Restore them before booking.");
  }
}

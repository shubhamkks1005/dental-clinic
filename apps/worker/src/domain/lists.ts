import type { HideMedicineResult, Repos } from "@clinic/db";
import type { ListItem } from "@clinic/shared";

// 1.5.4 editable lists. Rules, permission, versions and audit live in the lists repository;
// every call replies with the fresh list.
export type ListChange =
  | { kind: "update"; input: unknown; version: number }
  | { kind: "active"; active: boolean; version: number }
  | { kind: "move"; direction: "up" | "down"; version: number }
  | { kind: "moveTo"; position: number; version: number };

export const listItemsOf = (repos: Repos, key: string): Promise<ListItem[]> =>
  repos.lists.list(key);

/** Adds at the end; the reply names the new item by id (two items may share a name). */
export async function addListItem(
  repos: Repos,
  key: string,
  input: unknown,
): Promise<{ items: ListItem[]; item: ListItem | null }> {
  const { items, id } = await repos.lists.addWithId(key, input);
  return { items, item: items.find((i) => i.id === id) ?? null };
}

export function changeListItem(
  repos: Repos,
  key: string,
  id: string,
  change: ListChange,
): Promise<ListItem[]> {
  switch (change.kind) {
    case "update":
      return repos.lists.update(key, id, change.input, change.version);
    case "active":
      return repos.lists.setActive(key, id, change.active, change.version);
    case "move":
      return repos.lists.move(key, id, change.direction, change.version);
    case "moveTo":
      return repos.lists.moveTo(key, id, change.position, change.version);
  }
}

/** Library Q12: hide a medicine, optionally taking it out of the sets that hold it. */
export const hideMedicine = (
  repos: Repos,
  id: string,
  version: number,
  removeFromSets: boolean,
): Promise<HideMedicineResult> => repos.lists.hideMedicine(id, version, removeFromSets);

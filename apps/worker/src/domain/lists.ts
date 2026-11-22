import type { Repos } from "@clinic/db";
import type { ListItem } from "@clinic/shared";

// 1.5.4 editable lists. Rules, permission, versions and audit live in the lists repository;
// every call replies with the fresh list.
export type ListChange =
  | { kind: "update"; input: unknown; version: number }
  | { kind: "active"; active: boolean; version: number }
  | { kind: "move"; direction: "up" | "down"; version: number };

export const listItemsOf = (repos: Repos, key: string): Promise<ListItem[]> =>
  repos.lists.list(key);

export const addListItem = (repos: Repos, key: string, input: unknown): Promise<ListItem[]> =>
  repos.lists.add(key, input);

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
  }
}

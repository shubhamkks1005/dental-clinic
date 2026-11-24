import {
  formatMoney,
  LIST_DEFS,
  type ListField,
  type ListItem,
  type ListKey,
} from "@clinic/shared";

export type LibraryFilter = "all" | "review" | "hidden";

/** A medicine the doctor has not added or saved in the Library yet (seed or added in a visit). */
export const needsReview = (listKey: ListKey, item: ListItem): boolean =>
  listKey === "medicines" && item.data.reviewed !== "yes";

export function countFilters(listKey: ListKey, items: ListItem[]) {
  return {
    all: items.length,
    review: items.filter((i) => i.active && needsReview(listKey, i)).length,
    hidden: items.filter((i) => !i.active).length,
  };
}

export function filterItems(
  listKey: ListKey,
  items: ListItem[],
  filter: LibraryFilter,
  query: string,
): ListItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((i) => {
    if (filter === "hidden" && i.active) return false;
    if (filter === "review" && !(i.active && needsReview(listKey, i))) return false;
    return !q || i.label.toLowerCase().includes(q);
  });
}

export type Column = { head: string; cell: (item: ListItem, used?: number) => string };

const text = (item: ListItem, name: string) => String(item.data[name] ?? "").trim();
const join = (...parts: string[]) => parts.filter(Boolean).join(" · ");

/** The columns of each list's table; every other list shows its name and one detail line. */
export function columnsFor(listKey: ListKey): Column[] {
  if (listKey === "medicines")
    return [
      { head: "Form and strength", cell: (i) => join(text(i, "form"), text(i, "strength")) || "-" },
      {
        head: "Usual dose",
        cell: (i) => join(text(i, "default_dose"), text(i, "default_frequency")) || "-",
      },
      { head: "Used, 30 days", cell: (_i, used) => (used === undefined ? "-" : String(used)) },
    ];
  if (listKey === "procedures")
    return [
      { head: "Usual fee", cell: (i) => formatMoney(Number(i.data.default_paise ?? 0)) },
      { head: "Code", cell: (i) => text(i, "code") || "-" },
    ];
  if (listKey === "visit_types")
    return [{ head: "Usual length", cell: (i) => `${Number(i.data.minutes ?? 0)} minutes` }];
  const extra = (LIST_DEFS[listKey].fields as readonly ListField[]).filter(
    (f) => f.kind === "text" && !f.hidden,
  );
  return extra.length
    ? [{ head: "Details", cell: (i) => join(...extra.map((f) => text(i, f.name))) || "-" }]
    : [];
}

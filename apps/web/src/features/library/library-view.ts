import {
  foodTimingWord,
  formatMoney,
  MEDICINE_FORM_WORD,
  medicineFormKey,
  visitColourName,
  type ListItem,
  type ListKey,
} from "@clinic/shared";

// The Library's pure rules: which cards show, in which order, with which words (no React here).

export type MedicineView = "all" | "review" | "hidden";
export type OtherView = "active" | "hidden";
export type LibraryView = MedicineView | OtherView;
export type SortBy = "custom" | "az" | "za";

export type MoreFilters = {
  category: string;
  form: string;
  strength: string;
  brand: string;
  combination: "" | "yes" | "no";
  addedBy: string;
};
export const NO_MORE_FILTERS: MoreFilters = {
  category: "",
  form: "",
  strength: "",
  brand: "",
  combination: "",
  addedBy: "",
};

export const text = (item: ListItem, name: string) => String(item.data[name] ?? "").trim();
const join = (sep: string, ...parts: string[]) => parts.filter(Boolean).join(sep);

/** A medicine added from a visit with "Add to my list" and not yet saved in the Library. */
export const needsReview = (listKey: ListKey, item: ListItem): boolean =>
  listKey === "medicines" && item.data.reviewed !== "yes";

export function countViews(listKey: ListKey, items: readonly ListItem[]) {
  const active = items.filter((i) => i.active);
  return {
    active: active.length,
    review: active.filter((i) => needsReview(listKey, i)).length,
    hidden: items.length - active.length,
  };
}

function inView(listKey: ListKey, item: ListItem, view: LibraryView): boolean {
  if (view === "hidden") return !item.active;
  if (!item.active) return false;
  return view === "review" ? needsReview(listKey, item) : true;
}

function matchesQuery(listKey: ListKey, item: ListItem, q: string): boolean {
  if (!q) return true;
  const hay =
    listKey === "medicines" ? [item.label, text(item, "salt"), text(item, "brand")] : [item.label];
  return hay.some((h) => h.toLowerCase().includes(q));
}

function matchesMore(item: ListItem, f: MoreFilters): boolean {
  const has = (field: string, want: string) =>
    !want || text(item, field).toLowerCase().includes(want.trim().toLowerCase());
  if (f.category && text(item, "category").toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.form && medicineFormKey(text(item, "form")) !== f.form) return false;
  if (f.combination === "yes" && text(item, "combination") !== "yes") return false;
  if (f.combination === "no" && text(item, "combination") === "yes") return false;
  if (f.addedBy && item.createdByName !== f.addedBy) return false;
  return has("strength", f.strength) && has("brand", f.brand);
}

export function filterItems(
  listKey: ListKey,
  items: readonly ListItem[],
  view: LibraryView,
  query: string,
  more: MoreFilters = NO_MORE_FILTERS,
): ListItem[] {
  const q = query.trim().toLowerCase();
  return items.filter(
    (i) =>
      inView(listKey, i, view) &&
      matchesQuery(listKey, i, q) &&
      (listKey !== "medicines" || matchesMore(i, more)),
  );
}

export function sortItems(items: readonly ListItem[], sort: SortBy): ListItem[] {
  if (sort === "custom") return [...items];
  const dir = sort === "az" ? 1 : -1;
  return [...items].sort(
    (a, b) => dir * a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );
}

const distinct = (values: string[]) =>
  [...new Map(values.filter(Boolean).map((v) => [v.toLowerCase(), v])).values()].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );

/** Choices for the More Filters selects, from what is in the list. */
export function filterChoices(items: readonly ListItem[]) {
  const forms = distinct(items.map((i) => medicineFormKey(text(i, "form"))));
  return {
    categories: distinct(items.map((i) => text(i, "category"))),
    forms: forms.map((key) => ({ key, word: MEDICINE_FORM_WORD[key] ?? key })),
    adders: distinct(items.map((i) => i.createdByName ?? "")),
  };
}

/** Lower-case labels that two or more ACTIVE items share (L3 / P7.3.5). */
export function twinLabels(items: readonly ListItem[]): Set<string> {
  const seen = new Map<string, number>();
  for (const i of items) {
    if (!i.active) continue;
    const k = i.label.toLowerCase();
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}

export type Usage = Record<string, { total: number; last30: number }>;

/** "Tab · 500 mg | 1 tab · 1-0-1 | You wrote this 48 times (6 in the last 30 days)". */
export function medicineLine(item: ListItem, usage: Usage | null, twin: boolean): string {
  const u = usage?.[item.label.toLowerCase()];
  const count = !usage
    ? "You wrote this - times"
    : `You wrote this ${u?.total ?? 0} times (${u?.last30 ?? 0} in the last 30 days)${twin ? " (this name)" : ""}`;
  return join(
    " | ",
    join(" · ", text(item, "form"), text(item, "strength")),
    join(" · ", text(item, "default_dose"), text(item, "default_frequency")),
    count,
  );
}

export const timingWord = (item: ListItem) => foodTimingWord(text(item, "timing"));

export const visitTypeLine = (item: ListItem) =>
  `${Number(item.data.minutes ?? 0)} mins · ${visitColourName(text(item, "color"))} tag`;

export const feeLine = (item: ListItem) =>
  `Usual fee: ${formatMoney(Number(item.data.default_paise ?? 0))}`;

/** Rupees typed by the doctor ("1,500", "₹ 1500.50") to paise; null when it is not a number. */
export function rupeesToPaise(typed: string): number | null {
  const clean = typed.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export const paiseToRupees = (paise: number) =>
  paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);

/** 1-based place of the item among the active items (the banner says it after an add). */
export const activePosition = (items: readonly ListItem[], id: string) =>
  items.filter((i) => i.active).findIndex((i) => i.id === id) + 1;

/** The list with the active items in a new order; hidden items keep their slots (L1). */
function withActiveOrder(items: readonly ListItem[], active: ListItem[]): ListItem[] {
  let next = 0;
  return items.map((i) => (i.active ? active[next++]! : i));
}

/** The order after moving an item to a 1-based place among the active items. */
export function movedTo(items: readonly ListItem[], id: string, position: number): ListItem[] {
  const active = items.filter((i) => i.active);
  const from = active.findIndex((i) => i.id === id);
  if (from < 0) return [...items];
  const [moved] = active.splice(from, 1);
  active.splice(Math.min(Math.max(position - 1, 0), active.length), 0, moved!);
  return withActiveOrder(items, active);
}

/** The order after one step up or down among the active items. */
export function movedBy(items: readonly ListItem[], id: string, direction: "up" | "down") {
  const position = activePosition(items, id) + (direction === "up" ? -1 : 1);
  return movedTo(items, id, position);
}

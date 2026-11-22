import type { PageQuery, SortDir } from "@clinic/shared";

// Clicking a header: same column flips the direction, a new column starts A-Z. Back to page 1.
export function toggleSort(query: PageQuery, key: string): PageQuery {
  const dir: SortDir = query.sort === key && query.dir === "asc" ? "desc" : "asc";
  return { ...query, sort: key, dir, page: 1 };
}

export function ariaSort(query: PageQuery, key: string): "ascending" | "descending" | "none" {
  if (query.sort !== key) return "none";
  return query.dir === "asc" ? "ascending" : "descending";
}

const count = (n: number) => n.toLocaleString("en-IN");

// "Showing 26-50 of 5,000"
export function rangeText(page: number, pageSize: number, total: number): string {
  if (total === 0) return "No results";
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `Showing ${count(from)}–${count(to)} of ${count(total)}`;
}

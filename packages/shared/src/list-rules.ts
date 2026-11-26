import type { ListItemData, ListKey } from "./lists";
import { fillAsDirected } from "./medicines";

// Library duplicate rule (brief 2026-11-25): an item is a duplicate only when the name AND every
// field are the same. The "reviewed" flag is not part of the item's content (L2), and an empty
// dose equals "As directed" because the server saves it that way.

/** The item's data as one comparable text: keys sorted, strings trimmed, case kept. */
export function canonicalListData(key: ListKey, data: ListItemData): string {
  const filled = key === "medicines" ? fillAsDirected(data) : data;
  const entries = Object.entries(filled)
    .filter(([k]) => k !== "reviewed")
    .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v] as const)
    .filter(([, v]) => v !== "")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(entries);
}

export function isSameListItem(
  key: ListKey,
  a: { label: string; data: ListItemData },
  b: { label: string; data: ListItemData },
): boolean {
  if (a.label.trim().toLowerCase() !== b.label.trim().toLowerCase()) return false;
  return canonicalListData(key, a.data) === canonicalListData(key, b.data);
}

/** Visit type colours with names (values from migration 0016), L19. */
export const VISIT_COLOURS = [
  { hex: "#1E4FA3", name: "Blue" },
  { hex: "#0B7A75", name: "Teal" },
  { hex: "#15803D", name: "Green" },
  { hex: "#B45309", name: "Amber" },
  { hex: "#C8202A", name: "Red" },
  { hex: "#1E3A8A", name: "Navy" },
  { hex: "#9A3412", name: "Rust" },
] as const;

export function visitColourName(hex: string | number | undefined | null): string {
  const v = String(hex ?? "")
    .trim()
    .toUpperCase();
  return VISIT_COLOURS.find((c) => c.hex === v)?.name ?? "Custom colour";
}

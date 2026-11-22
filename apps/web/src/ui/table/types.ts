import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  // Words for the phone "Sort by" list; default "A to Z" / "Z to A".
  sortText?: { asc: string; desc: string };
};

export type TableStatus =
  { state: "loading" } | { state: "ready" } | { state: "error"; message: string };

import type { PageQuery } from "@clinic/shared";
import { useEffect, useState } from "react";
import type { Column } from "./types";

const SEARCH_DELAY_MS = 300;

// Search box (asks the server after a short pause in typing) and, on phones, a "Sort by" list
// because the column headers are not shown there.
export function TableFilter<T>({
  label,
  query,
  onQuery,
  columns,
}: {
  label: string;
  query: PageQuery;
  onQuery: (query: PageQuery) => void;
  columns: Column<T>[];
}) {
  const [draft, setDraft] = useState(query.q);
  useEffect(() => {
    if (draft.trim() === query.q) return;
    const timer = setTimeout(
      () => onQuery({ ...query, q: draft.trim(), page: 1 }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [draft, query, onQuery]);

  const sortable = columns.filter((c) => c.sortable);
  return (
    <div className="dt-tools">
      <label className="dt-filter">
        <span className="sr-only">{label}</span>
        <input
          className="input"
          type="search"
          placeholder={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      {sortable.length > 0 && (
        <label className="dt-sort-select">
          <span className="sr-only">Sort by</span>
          <select
            className="input"
            value={query.sort ? `${query.sort}:${query.dir}` : ""}
            onChange={(e) => {
              const [sort = "", dir] = e.target.value.split(":");
              onQuery({
                ...query,
                sort: sort || null,
                dir: dir === "desc" ? "desc" : "asc",
                page: 1,
              });
            }}
          >
            <option value="">Sort by</option>
            {sortable.flatMap((c) => [
              <option key={`${c.key}:asc`} value={`${c.key}:asc`}>
                {c.label}, {c.sortText?.asc ?? "A to Z"}
              </option>,
              <option key={`${c.key}:desc`} value={`${c.key}:desc`}>
                {c.label}, {c.sortText?.desc ?? "Z to A"}
              </option>,
            ])}
          </select>
        </label>
      )}
    </div>
  );
}

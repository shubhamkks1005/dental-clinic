import { lastPage, type Page, type PageQuery } from "@clinic/shared";
import type { ReactNode } from "react";
import { ariaSort, rangeText, toggleSort } from "./table-query";
import type { Column } from "./types";

type ViewProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  query: PageQuery;
  onQuery: (query: PageQuery) => void;
};

const ARROW = { ascending: "▲", descending: "▼", none: "" } as const;

// Tablet and laptop: a real table that scrolls inside its own box if it is too wide.
export function TableView<T>({ caption, columns, rows, rowKey, query, onQuery }: ViewProps<T>) {
  return (
    <div className="dt-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="dt-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={c.sortable ? ariaSort(query, c.key) : undefined}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    className="dt-sort"
                    onClick={() => onQuery(toggleSort(query, c.key))}
                  >
                    {c.label}
                    <span className="dt-arrow" aria-hidden="true">
                      {ARROW[ariaSort(query, c.key)]}
                    </span>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Phone: one card per row; the first column is the card title.
export function CardView<T>({
  caption,
  columns,
  rows,
  rowKey,
  renderCard,
}: ViewProps<T> & { renderCard?: (row: T) => ReactNode }) {
  const [title, ...rest] = columns;
  return (
    <ul className="dt-cards" aria-label={caption}>
      {rows.map((row) =>
        renderCard ? (
          <li key={rowKey(row)}>{renderCard(row)}</li>
        ) : (
          <li key={rowKey(row)} className="dt-card">
            {title && <p className="dt-card-title">{title.render(row)}</p>}
            {rest.map((c) => (
              <p key={c.key} className="dt-card-line">
                <span className="small muted">{c.label}</span>
                <span>{c.render(row)}</span>
              </p>
            ))}
          </li>
        ),
      )}
    </ul>
  );
}

export function TablePager<T>({
  page,
  query,
  onQuery,
}: {
  page: Page<T>;
  query: PageQuery;
  onQuery: (query: PageQuery) => void;
}) {
  const last = lastPage(page.total, page.pageSize);
  return (
    <div className="dt-pager">
      <p className="small muted" aria-live="polite">
        {rangeText(page.page, page.pageSize, page.total)}
      </p>
      <div className="dt-pager-buttons">
        <button
          type="button"
          className="btn btn-compact"
          disabled={query.page <= 1}
          onClick={() => onQuery({ ...query, page: query.page - 1 })}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-compact"
          disabled={query.page >= last}
          onClick={() => onQuery({ ...query, page: query.page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
}

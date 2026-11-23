import type { Page, PageQuery } from "@clinic/shared";
import type { ReactNode } from "react";
import { TableFilter } from "./TableFilter";
import { CardView, TablePager, TableView } from "./TableViews";
import type { Column, TableStatus } from "./types";
import "./data-table.css";

type Props<T> = {
  caption: string;
  filterLabel: string;
  emptyText: string;
  columns: Column<T>[];
  page: Page<T> | null;
  query: PageQuery;
  onQuery: (query: PageQuery) => void;
  rowKey: (row: T) => string;
  status: TableStatus;
  onRetry: () => void;
  /** Phone: draw a row as your own card (for example a whole-card link) instead of title and lines. */
  renderCard?: (row: T) => ReactNode;
};

// 1.4.5 data table kit: the server sorts, filters and pages (packages/shared/src/paging.ts); this
// shows one page. Table on tablet and laptop, cards on phones. Loading, error and empty states.
export function DataTable<T>(props: Props<T>) {
  const { page, status, query, onQuery } = props;
  const view = { ...props, rows: page?.rows ?? [] };

  return (
    <div className="dt" aria-busy={status.state === "loading"}>
      <TableFilter
        label={props.filterLabel}
        query={query}
        onQuery={onQuery}
        columns={props.columns}
      />
      {status.state === "error" && (
        <div className="notice notice-error dt-error" role="alert">
          <span>{status.message}</span>
          <button type="button" className="btn btn-compact" onClick={props.onRetry}>
            Try again
          </button>
        </div>
      )}
      {page === null ? (
        status.state === "loading" && <p className="dt-note muted">Loading...</p>
      ) : page.total === 0 ? (
        <p className="dt-note muted">{props.emptyText}</p>
      ) : (
        <>
          <TableView {...view} />
          <CardView {...view} renderCard={props.renderCard} />
          <TablePager page={page} query={query} onQuery={onQuery} />
        </>
      )}
    </div>
  );
}

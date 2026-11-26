import type { ListItem, ListKey } from "@clinic/shared";
import { useState } from "react";
import { LibraryCard } from "./LibraryCard";
import { CardDetails, CardLine } from "./LibraryCardDetails";
import { LibraryIcon } from "./LibraryIcon";
import { needsReview, type Usage } from "./library-view";

export const PAGE = 25;

type Props = {
  listKey: ListKey;
  rows: ListItem[];
  loading: boolean;
  reorder: boolean;
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  shown: number;
  onShowMore: () => void;
  usage: Usage | null;
  twins: ReadonlySet<string>;
  medicines: readonly ListItem[] | null;
  emptyText: string;
  onReset: (() => void) | null;
  onConfirm: (item: ListItem) => void;
  onEdit: (item: ListItem) => void;
  onActive: (item: ListItem) => void;
  onMove: (item: ListItem, direction: "up" | "down") => void;
  onMoveTo: (item: ListItem, position: number) => void;
  announce: string;
};

// The cards (HTML 954-1031). Reorder: drag with a mouse (L22: touch and keyboard use the arrows).
export function LibraryCards(p: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (p.loading)
    return (
      <div className="ld-list-cards" aria-busy="true" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ld-skeleton" />
        ))}
      </div>
    );
  if (p.rows.length === 0)
    return (
      <div className="ld-empty">
        {p.emptyText}
        {p.onReset ? (
          <button type="button" onClick={p.onReset}>
            Reset filters
          </button>
        ) : null}
      </div>
    );

  const visible = p.reorder ? p.rows : p.rows.slice(0, p.shown);
  const last = p.rows.length - 1;
  return (
    <>
      <div className="ld-list-cards">
        {visible.map((item, idx) => (
          <LibraryCard
            key={item.id}
            listKey={p.listKey}
            item={item}
            expanded={p.expanded.has(item.id)}
            onToggle={() => p.onToggle(item.id)}
            line={
              <CardLine
                listKey={p.listKey}
                item={item}
                usage={p.usage}
                twin={p.twins.has(item.label.toLowerCase())}
                medicines={p.medicines}
              />
            }
            details={<CardDetails listKey={p.listKey} item={item} />}
            drag={
              p.reorder
                ? {
                    dragging: dragId === item.id,
                    dropTarget: overId === item.id && dragId !== item.id,
                    onDragStart: (e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(item.id);
                    },
                    onDragOver: (e) => {
                      e.preventDefault();
                      setOverId(item.id);
                    },
                    onDragLeave: () => setOverId((o) => (o === item.id ? null : o)),
                    onDrop: (e) => {
                      e.preventDefault();
                      const moving = p.rows.find((r) => r.id === dragId);
                      setDragId(null);
                      setOverId(null);
                      if (moving && moving.id !== item.id) p.onMoveTo(moving, idx + 1);
                    },
                    onDragEnd: () => {
                      setDragId(null);
                      setOverId(null);
                    },
                  }
                : undefined
            }
            actions={
              p.reorder ? (
                <>
                  <button
                    type="button"
                    className="ld-action icon"
                    aria-label={`Move ${item.label} up`}
                    disabled={idx === 0}
                    onClick={() => p.onMove(item, "up")}
                  >
                    <LibraryIcon name="arrow_upward" />
                  </button>
                  <button
                    type="button"
                    className="ld-action icon"
                    aria-label={`Move ${item.label} down`}
                    disabled={idx === last}
                    onClick={() => p.onMove(item, "down")}
                  >
                    <LibraryIcon name="arrow_downward" />
                  </button>
                </>
              ) : (
                <>
                  {item.active && needsReview(p.listKey, item) ? (
                    <button
                      type="button"
                      className="ld-action confirm"
                      onClick={() => p.onConfirm(item)}
                    >
                      Confirm
                    </button>
                  ) : null}
                  <button type="button" className="ld-action" onClick={() => p.onEdit(item)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ld-action muted"
                    onClick={() => p.onActive(item)}
                  >
                    {item.active ? "Hide" : "Show again"}
                  </button>
                </>
              )
            }
          />
        ))}
      </div>
      {!p.reorder && p.rows.length > p.shown ? (
        <button type="button" className="ld-tool ld-show-more" onClick={p.onShowMore}>
          Show more ({p.rows.length - p.shown} left)
        </button>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {p.announce}
      </p>
    </>
  );
}

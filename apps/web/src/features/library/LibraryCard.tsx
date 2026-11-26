import { categoryTint, type ListItem, type ListKey } from "@clinic/shared";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { LibraryIcon } from "./LibraryIcon";
import { needsReview, text } from "./library-view";

/** Card tint (HTML 862-874): medicines by category (L23), other lists by list. */
export function tintOf(listKey: ListKey, item: ListItem): string {
  if (listKey === "medicines") return `tint-${categoryTint(text(item, "category"))}`;
  if (listKey === "medicine_sets") return "tint-sets";
  if (listKey === "procedures") return "tint-procedures";
  if (listKey === "visit_types" || listKey === "quick_phrases") return "tint-green";
  return "tint-other";
}

export type DragProps = {
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
};

type Props = {
  listKey: ListKey;
  item: ListItem;
  expanded: boolean;
  onToggle: () => void;
  line: ReactNode;
  details: ReactNode;
  actions: ReactNode;
  /** Set while reordering: drag handle, arrows, no expand (HTML 1010-1019). */
  drag?: DragProps;
};

export function LibraryCard({
  listKey,
  item,
  expanded,
  onToggle,
  line,
  details,
  actions,
  drag,
}: Props) {
  const category = listKey === "medicines" ? text(item, "category") : "";
  const tint = categoryTint(category);
  const classes = [
    "ld-card",
    item.active ? tintOf(listKey, item) : "is-hidden",
    drag ? "reorder" : "",
    drag?.dragging ? "dragging" : "",
    drag?.dropTarget ? "drop-target" : "",
  ];
  const onKey = (e: KeyboardEvent) => {
    if (drag || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <article
      className={classes.filter(Boolean).join(" ")}
      data-row-id={item.id}
      tabIndex={drag ? undefined : 0}
      aria-expanded={drag ? undefined : expanded}
      aria-label={item.label}
      onClick={drag ? undefined : onToggle}
      onKeyDown={onKey}
      draggable={drag ? true : undefined}
      onDragStart={drag?.onDragStart}
      onDragOver={drag?.onDragOver}
      onDragLeave={drag?.onDragLeave}
      onDrop={drag?.onDrop}
      onDragEnd={drag?.onDragEnd}
    >
      <div className="ld-card-row">
        <div className="ld-card-main">
          <div className="ld-card-head">
            {drag ? (
              <LibraryIcon name="drag_indicator" className="ld-drag" />
            ) : (
              <LibraryIcon
                name="expand_more"
                className={`ld-card-chevron${expanded ? " open" : ""}`}
              />
            )}
            <h3 className="ld-title-md">{item.label}</h3>
            {category && tint !== "neutral" ? (
              <span className={`ld-pill ld-tint-pill-${tint}`}>{category}</span>
            ) : null}
            {item.active && needsReview(listKey, item) ? (
              <span className="ld-pill ld-pill-warning">Needs review</span>
            ) : null}
            {!item.active ? <span className="ld-pill ld-pill-hidden">Hidden</span> : null}
          </div>
          {line}
        </div>
        <div className="ld-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </div>
      {expanded && !drag ? details : null}
    </article>
  );
}

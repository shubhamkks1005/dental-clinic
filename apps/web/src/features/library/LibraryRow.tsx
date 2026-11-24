import type { ListItem, ListKey } from "@clinic/shared";
import { StatusBadge } from "../../ui/StatusBadge";
import { columnsFor, needsReview } from "./library-view";

type Props = {
  listKey: ListKey;
  item: ListItem;
  used?: number;
  reorder: boolean;
  first: boolean;
  last: boolean;
  busy: boolean;
  onEdit: () => void;
  onActive: () => void;
  onMove: (direction: "up" | "down") => void;
};

export function LibraryRow({
  listKey,
  item,
  used,
  reorder,
  first,
  last,
  busy,
  onEdit,
  onActive,
  onMove,
}: Props) {
  const colour = listKey === "visit_types" ? String(item.data.color ?? "") : "";
  return (
    <li className={`library-row${item.active ? "" : " is-hidden"}`}>
      <div className="library-name">
        {colour ? (
          <span className="item-colour-swatch" style={{ backgroundColor: colour }} aria-hidden />
        ) : null}
        <strong>{item.label}</strong>
        {!item.active ? <StatusBadge tone="upcoming" label="Hidden" /> : null}
        {item.active && needsReview(listKey, item) ? (
          <span className="library-draft">DRAFT - doctor to confirm</span>
        ) : null}
      </div>
      {columnsFor(listKey).map((c) => (
        <div key={c.head} className="library-cell" data-head={c.head}>
          {c.cell(item, used)}
        </div>
      ))}
      <div className="library-actions">
        {reorder ? (
          <>
            <button
              type="button"
              className="btn btn-compact"
              aria-label={`Move ${item.label} up`}
              disabled={busy || first}
              onClick={() => onMove("up")}
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-compact"
              aria-label={`Move ${item.label} down`}
              disabled={busy || last}
              onClick={() => onMove("down")}
            >
              ↓
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-compact"
              disabled={busy}
              aria-label={`Edit ${item.label}`}
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-compact"
              disabled={busy}
              aria-label={`${item.active ? "Hide" : "Show"} ${item.label}`}
              onClick={onActive}
            >
              {item.active ? "Hide" : "Show"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

import { LIST_DEFS, type ListKey } from "@clinic/shared";
import { Select } from "../../ui/form";
import { LibraryIcon } from "./LibraryIcon";
import type { OtherView, SortBy } from "./library-view";

type Props = {
  listKey: ListKey;
  counts: { active: number; hidden: number };
  view: OtherView | null;
  onView: (v: OtherView) => void;
  sort: SortBy;
  onSort: (s: SortBy) => void;
  reorder: boolean;
  onReorder: () => void;
  canReorder: boolean;
};

// HTML 349-371: list title and help (LIST_DEFS words), Active / Hidden pills on the other lists,
// sort select, Reorder, and the reorder banner.
export function LibraryListBar(props: Props) {
  const { listKey, counts, view, onView, sort, onSort, reorder, onReorder, canReorder } = props;
  const def = LIST_DEFS[listKey];
  const reason =
    sort !== "custom"
      ? "Switch to Custom order to reorder."
      : counts.active < 2
        ? "Only one item."
        : "";
  return (
    <>
      <div className="ld-list-bar">
        <div>
          <h2 className="ld-title-lg">{def.title}</h2>
          <p className="ld-body-sm">{def.help}</p>
        </div>
        <div className="ld-list-tools">
          {view && !reorder ? (
            <div className="ld-status" role="group" aria-label="Show">
              <button
                type="button"
                aria-pressed={view === "active"}
                onClick={() => onView("active")}
              >
                Active {counts.active}
              </button>
              <button
                type="button"
                aria-pressed={view === "hidden"}
                onClick={() => onView("hidden")}
              >
                Hidden {counts.hidden}
              </button>
            </div>
          ) : null}
          {!reorder ? (
            <Select
              className="ld-select ld-tool"
              aria-label="Sort items"
              value={sort}
              onChange={(e) => onSort(e.target.value as SortBy)}
            >
              <option value="custom">Sort: Custom order</option>
              <option value="az">Sort: A → Z</option>
              <option value="za">Sort: Z → A</option>
            </Select>
          ) : null}
          <button
            type="button"
            className="ld-tool"
            aria-pressed={reorder}
            disabled={!reorder && !canReorder}
            aria-describedby={reason && !reorder ? "ld-reorder-why" : undefined}
            onClick={onReorder}
          >
            <LibraryIcon name="swap_vert" className="ld-icon-sm" />
            <span>{reorder ? "Done" : "Reorder"}</span>
          </button>
          {reason && !reorder ? (
            <p id="ld-reorder-why" className="ld-hint">
              {reason}
            </p>
          ) : null}
        </div>
      </div>
      {reorder ? (
        <div className="ld-reorder-banner">
          <span>
            Reordering active items. Drag cards up/down or use arrows to set your preferred order.
          </span>
          <button type="button" onClick={onReorder}>
            Done
          </button>
        </div>
      ) : null}
    </>
  );
}

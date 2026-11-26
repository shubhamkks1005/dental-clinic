import type { ListItem } from "@clinic/shared";
import { useId, useMemo, useState } from "react";
import { Select, TextInput } from "../../ui/form";
import { LibraryIcon } from "./LibraryIcon";
import { filterChoices, type MedicineView, type MoreFilters } from "./library-view";

type Props = {
  items: readonly ListItem[];
  counts: { active: number; review: number; hidden: number };
  view: MedicineView;
  onView: (v: MedicineView) => void;
  more: MoreFilters;
  onMore: (m: MoreFilters) => void;
  onReset: () => void;
};

// HTML 253-345, trimmed by the owner: quick views All / Needs review / Hidden, and More Filters
// with Category, Dosage form, Strength, Brand, Combination and Added by only.
export function LibraryFilterColumn({ items, counts, view, onView, more, onMore, onReset }: Props) {
  const [open, setOpen] = useState(false);
  // Under 1024 px the column folds into a "Filters" row above the cards (P7.1).
  const [shown, setShown] = useState(false);
  const collapseId = useId();
  const choices = useMemo(() => filterChoices(items), [items]);
  const set = (patch: Partial<MoreFilters>) => onMore({ ...more, ...patch });
  const quick: [MedicineView, string, number][] = [
    ["all", "All Medicines", counts.active],
    ["review", "Needs review", counts.review],
    ["hidden", "Hidden", counts.hidden],
  ];

  return (
    <aside className="ld-filters" aria-label="Filter Medicines">
      <div className="ld-row">
        <h2 className="ld-title-md">Filter Medicines</h2>
        <button type="button" className="ld-link" onClick={onReset}>
          Reset
        </button>
      </div>
      <button
        type="button"
        className="ld-more-btn ld-filters-toggle"
        aria-expanded={shown}
        onClick={() => setShown(!shown)}
      >
        <span>Filters</span>
        <LibraryIcon name="expand_more" className="ld-chevron" />
      </button>
      <div className={`ld-filters-body${shown ? "" : " closed"}`}>
        <div className="ld-quick" role="group" aria-label="Quick Views">
          <span className="ld-small-label">Quick Views</span>
          {quick.map(([id, label, n]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => onView(id)}>
              <span>{label}</span>
              {id === "review" ? (
                <span className="ld-pill ld-pill-warning ld-mono">{n}</span>
              ) : (
                <span className="ld-mono">{n}</span>
              )}
            </button>
          ))}
        </div>
        <div className="ld-more-filters">
          <button
            type="button"
            className="ld-more-btn"
            aria-expanded={open}
            aria-controls={collapseId}
            onClick={() => setOpen(!open)}
          >
            <span>
              <LibraryIcon name="tune" className="ld-icon-sm" />
              <span>More Filters</span>
            </span>
            <LibraryIcon name="expand_more" className="ld-icon-sm ld-chevron" />
          </button>
          <div
            id={collapseId}
            className={`ld-collapse${open ? " open" : ""}`}
            data-testid="more-filters"
          >
            <div className="ld-collapse-inner" inert={!open}>
              <div className="ld-collapse-fields">
                <Select
                  aria-label="Category"
                  value={more.category}
                  onChange={(e) => set({ category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {choices.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  aria-label="Dosage Form"
                  value={more.form}
                  onChange={(e) => set({ form: e.target.value })}
                >
                  <option value="">All Dosage Forms</option>
                  {choices.forms.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.word}
                    </option>
                  ))}
                </Select>
                <div className="ld-two">
                  <TextInput
                    aria-label="Strength"
                    placeholder="Strength"
                    value={more.strength}
                    onChange={(e) => set({ strength: e.target.value })}
                  />
                  <TextInput
                    aria-label="Brand"
                    placeholder="Brand"
                    value={more.brand}
                    onChange={(e) => set({ brand: e.target.value })}
                  />
                </div>
                <Select
                  aria-label="Combination"
                  value={more.combination}
                  onChange={(e) =>
                    set({ combination: e.target.value as MoreFilters["combination"] })
                  }
                >
                  <option value="">Combination: All</option>
                  <option value="yes">Combination only</option>
                  <option value="no">Not a combination</option>
                </Select>
                <Select
                  aria-label="Added By"
                  value={more.addedBy}
                  onChange={(e) => set({ addedBy: e.target.value })}
                >
                  <option value="">Added by Anyone</option>
                  {choices.adders.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { LIST_DEFS, type ListKey } from "@clinic/shared";
import { TextInput } from "../../ui/form";
import { LibraryIcon } from "./LibraryIcon";

/** The item word of each list, as in the design (HTML 417-428, 914). */
export const ITEM_WORD: Record<ListKey, string> = {
  medicines: "medicine",
  medicine_sets: "medicine set",
  procedures: "procedure",
  visit_types: "visit type",
  diagnoses: "diagnosis",
  quick_phrases: "quick phrase",
  conditions: "tooth condition",
  allergens: "allergen",
  referral_sources: "referral source",
  medical_history_items: "checklist item",
};

type Props = {
  listKey: ListKey;
  query: string;
  onQuery: (q: string) => void;
  onAdd: () => void;
};

// HTML 204-219: title, "Doctor only", search, Add <item>.
export function LibraryHeader({ listKey, query, onQuery, onAdd }: Props) {
  const placeholder =
    listKey === "medicines"
      ? "Search medicine or salt..."
      : `Search ${LIST_DEFS[listKey].title.toLowerCase()}...`;
  return (
    <header className="ld-header">
      <div className="ld-header-title">
        <h1 className="ld-headline">Library</h1>
        <span className="ld-pill ld-pill-secondary ld-doctor-only">Doctor only</span>
      </div>
      <div className="ld-header-tools">
        <div className="ld-search">
          <LibraryIcon name="search" />
          <TextInput
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search within active list"
          />
        </div>
        <button type="button" className="ld-btn-primary" onClick={onAdd}>
          <LibraryIcon name="add" />
          <span className="ld-add-word">Add {ITEM_WORD[listKey]}</span>
        </button>
      </div>
    </header>
  );
}

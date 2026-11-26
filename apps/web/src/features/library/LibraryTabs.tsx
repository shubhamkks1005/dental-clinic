import { LIST_DEFS, type ListKey } from "@clinic/shared";
import { useRef, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router";
import { nextTabIndex } from "../../ui/tabs-keys";

// HTML 222-239: one tab strip, and under "More" a second strip of setup lists.
export const TABS: { key: ListKey | "more"; label: string }[] = [
  { key: "medicines", label: "Medicines" },
  { key: "medicine_sets", label: "Medicine sets" },
  { key: "procedures", label: "Procedures and fees" },
  { key: "visit_types", label: "Visit types" },
  { key: "diagnoses", label: "Diagnoses" },
  { key: "quick_phrases", label: "Quick phrases" },
  { key: "more", label: "More" },
];

export const MORE_LISTS: ListKey[] = [
  "conditions",
  "allergens",
  "referral_sources",
  "medical_history_items",
];

const tabOf = (key: ListKey) => (MORE_LISTS.includes(key) ? "more" : key);
const hrefOf = (key: ListKey | "more") => `/app/library/${key === "more" ? MORE_LISTS[0] : key}`;

export function LibraryTabs({ listKey }: { listKey: ListKey }) {
  const navigate = useNavigate();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const active = tabOf(listKey);

  function onKey(e: KeyboardEvent, index: number) {
    const next = nextTabIndex(index, e.key, TABS.length);
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    void navigate(hrefOf(TABS[next]!.key));
  }

  return (
    <div className="ld-tabs" role="tablist" aria-label="Library lists">
      {TABS.map((t, i) => (
        <Link
          key={t.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          to={hrefOf(t.key)}
          role="tab"
          className="ld-tab"
          aria-selected={active === t.key}
          tabIndex={active === t.key ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function LibraryMoreStrip({ listKey }: { listKey: ListKey }) {
  if (!MORE_LISTS.includes(listKey)) return null;
  return (
    <nav className="ld-more" aria-label="Setup lists">
      <span className="ld-more-label">Setup lists:</span>
      {MORE_LISTS.map((k) => (
        <Link key={k} to={`/app/library/${k}`} aria-current={k === listKey ? "page" : undefined}>
          {LIST_DEFS[k].title}
        </Link>
      ))}
    </nav>
  );
}

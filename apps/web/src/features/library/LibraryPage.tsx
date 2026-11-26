import {
  LIST_DEFS,
  setsUsingMedicine,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { MedicinesListReview } from "../settings";
import { HideMedicineDialog } from "./HideMedicineDialog";
import { LibraryBanner, type Banner } from "./LibraryBanner";
import { LibraryCards, PAGE } from "./LibraryCards";
import { LibraryFilterColumn } from "./LibraryFilterColumn";
import { LibraryHeader } from "./LibraryHeader";
import { LibraryListBar } from "./LibraryListBar";
import { LibraryModal, type ModalState } from "./LibraryModal";
import { LibraryMoreStrip, LibraryTabs } from "./LibraryTabs";
import { useLibraryData } from "./useLibraryData";
import {
  activePosition,
  countViews,
  filterChoices,
  filterItems,
  movedBy,
  movedTo,
  NO_MORE_FILTERS,
  sortItems,
  twinLabels,
  type LibraryView,
  type MoreFilters,
  type SortBy,
} from "./library-view";

type Saved = { query: string; view: LibraryView; more: MoreFilters; sort: SortBy };
type NewMedicine = { name: string; resolve: (m: ListItem | null) => void };

export function LibraryPage({ listKey }: { listKey: ListKey }) {
  const isMed = listKey === "medicines";
  const title = LIST_DEFS[listKey].title;
  const data = useLibraryData(listKey);
  const [params, setParams] = useSearchParams();
  const fromAddress = params.get("filter");
  const defaultView: LibraryView = isMed ? "all" : "active";
  const view: LibraryView =
    fromAddress === "hidden" || (isMed && fromAddress === "review") ? fromAddress : defaultView;
  const setView = (v: LibraryView) => {
    setParams(v === defaultView ? {} : { filter: v }, { replace: true });
    setShown(PAGE);
  };
  const [query, setQuery] = useState("");
  const [more, setMore] = useState<MoreFilters>(NO_MORE_FILTERS);
  const [sort, setSort] = useState<SortBy>("custom");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [shown, setShown] = useState(PAGE);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [newMed, setNewMed] = useState<NewMedicine | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [hiding, setHiding] = useState<{ item: ListItem; sets: ListItem[] } | null>(null);
  const [announce, setAnnounce] = useState("");
  const reorder = saved !== null;

  const items = useMemo(() => data.items ?? [], [data.items]);
  const counts = useMemo(() => countViews(listKey, items), [listKey, items]);
  const twins = useMemo(() => twinLabels(items), [items]);
  const medicines = isMed ? data.items : listKey === "medicine_sets" ? data.companion : null;
  const categories = useMemo(() => filterChoices(medicines ?? []).categories, [medicines]);
  const rows = useMemo(
    () =>
      reorder
        ? filterItems(listKey, items, defaultView, "")
        : sortItems(filterItems(listKey, items, view, query, more), sort),
    [listKey, items, view, query, more, sort, reorder, defaultView],
  );

  const say = (text: string) => setBanner({ id: Date.now(), text });
  const resetFilters = () => {
    setQuery("");
    setMore(NO_MORE_FILTERS);
    setView(defaultView);
  };
  const toggleReorder = () => {
    if (saved) {
      setQuery(saved.query);
      setMore(saved.more);
      setSort(saved.sort);
      setView(saved.view);
      setSaved(null);
      return;
    }
    setSaved({ query, view, more, sort });
    setQuery("");
    setMore(NO_MORE_FILTERS);
    setSort("custom");
    setView(defaultView);
    setExpanded(new Set());
  };

  async function onSave(input: ListItemInput, item: ListItem | undefined, confirm: boolean) {
    const r = await data.save(input, item);
    if (!r.ok) return r.problem;
    if (!item && r.item) {
      const n = activePosition(r.items, r.item.id);
      say(`"${input.label}" added to ${title}. It is at the end (position ${n}).`);
    } else say(confirm ? "Saved and marked reviewed." : `Updated "${input.label}".`);
    return null;
  }

  async function onActive(item: ListItem) {
    const sets = isMed && item.active ? setsUsingMedicine(item, data.companion ?? []) : [];
    if (sets.length > 0) return setHiding({ item, sets });
    if (await data.setActive(item, !item.active))
      say(
        item.active
          ? `"${item.label}" is hidden from clinic choices.`
          : `"${item.label}" is active again.`,
      );
  }

  async function onHideChoice(removeFromSets: boolean) {
    if (!hiding) return;
    const { item } = hiding;
    setHiding(null);
    const r = await data.hideWithSets(item, removeFromSets);
    if (!r) return;
    const left = r.emptySets.length
      ? ` Not changed: ${r.emptySets.join(", ")} would have no medicine left. Edit or hide that set.`
      : "";
    say(`"${item.label}" is hidden from clinic choices.${left}`);
  }

  const moved = (ok: boolean, item: ListItem, next: ListItem[]) => {
    if (!ok) return;
    setAnnounce(`Moved to position ${activePosition(next, item.id)} of ${counts.active}`);
  };
  const onMove = (item: ListItem, direction: "up" | "down") => {
    const next = movedBy(items, item.id, direction);
    void data.move(item, direction, next).then((ok) => moved(ok, item, next));
  };
  const onMoveTo = (item: ListItem, position: number) => {
    const next = movedTo(items, item.id, position);
    void data.moveTo(item, position, next).then((ok) => moved(ok, item, next));
  };

  const emptyText =
    items.length === 0
      ? `No ${title.toLowerCase()} yet.`
      : isMed && view === "review" && !query
        ? "All medicines reviewed."
        : "Nothing matches your current filter.";

  return (
    <div className="library-doc library-page">
      <LibraryHeader
        listKey={listKey}
        query={query}
        onQuery={(q) => {
          setQuery(q);
          setShown(PAGE);
        }}
        onAdd={() => setModal({ listKey })}
      />
      <LibraryTabs listKey={listKey} />
      <LibraryMoreStrip listKey={listKey} />
      {banner ? (
        <LibraryBanner key={banner.id} banner={banner} onClose={() => setBanner(null)} />
      ) : null}
      <main className={`ld-main${isMed ? " has-filters" : ""}`}>
        {isMed ? (
          <LibraryFilterColumn
            items={items}
            counts={counts}
            view={view as "all" | "review" | "hidden"}
            onView={setView}
            more={more}
            onMore={setMore}
            onReset={resetFilters}
          />
        ) : null}
        <section className="ld-list" aria-label={title}>
          <LibraryListBar
            listKey={listKey}
            counts={counts}
            view={isMed ? null : (view as "active" | "hidden")}
            onView={setView}
            sort={sort}
            onSort={setSort}
            reorder={reorder}
            onReorder={toggleReorder}
            canReorder={sort === "custom" && counts.active > 1}
          />
          {data.problem && !data.items ? (
            <div className="ld-empty" role="alert">
              {data.problem}
              <button type="button" onClick={data.load}>
                Retry
              </button>
            </div>
          ) : (
            <LibraryCards
              listKey={listKey}
              rows={rows}
              loading={data.items === null}
              reorder={reorder}
              expanded={expanded}
              onToggle={(id) => {
                const next = new Set(expanded);
                if (!next.delete(id)) next.add(id);
                setExpanded(next);
              }}
              shown={shown}
              onShowMore={() => setShown(shown + PAGE)}
              usage={data.usageFailed ? null : data.usage}
              twins={twins}
              medicines={medicines}
              emptyText={emptyText}
              onReset={items.length > 0 && emptyText.startsWith("Nothing") ? resetFilters : null}
              onConfirm={(item) => setModal({ listKey, item, confirm: true })}
              onEdit={(item) => setModal({ listKey, item })}
              onActive={(item) => void onActive(item)}
              onMove={onMove}
              onMoveTo={onMoveTo}
              announce={announce}
            />
          )}
          {isMed ? <MedicinesListReview /> : null}
        </section>
      </main>
      {modal ? (
        <LibraryModal
          state={modal}
          medicines={medicines ?? []}
          categories={categories}
          onSave={onSave}
          onClose={() => setModal(null)}
          onNewMedicine={(name) => new Promise((resolve) => setNewMed({ name, resolve }))}
        />
      ) : null}
      {newMed ? (
        <LibraryModal
          state={{ listKey: "medicines", name: newMed.name }}
          medicines={[]}
          categories={[]}
          onSave={async (input) => {
            const r = await data.addMedicine(input);
            if (!r.ok) return r.problem;
            newMed.resolve(r.item);
            return null;
          }}
          onClose={() => {
            newMed.resolve(null);
            setNewMed(null);
          }}
          onNewMedicine={() => Promise.resolve(null)}
        />
      ) : null}
      {hiding ? (
        <HideMedicineDialog
          medicine={hiding.item}
          sets={hiding.sets}
          onChoose={(remove) => void onHideChoice(remove)}
          onCancel={() => setHiding(null)}
        />
      ) : null}
    </div>
  );
}

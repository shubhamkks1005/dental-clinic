import { LIST_DEFS, type ListItem, type ListItemInput, type ListKey } from "@clinic/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { TextInput } from "../../ui/form";
import { useSubmitOnce } from "../../ui/submit-guard";
import { useToast } from "../../ui/Toast";
import { addItem, getList, moveItem, setItemActive, updateItem } from "../lists";
import { getMedicineUsage } from "./api";
import { LibraryDrawer, type DrawerState } from "./LibraryDrawer";
import { LibraryRow } from "./LibraryRow";
import { columnsFor, countFilters, filterItems, type LibraryFilter } from "./library-view";

const PAGE = 25;

// Library.dc.html: a table per list with filter chips, search, a separate Reorder mode and a
// right-side drawer to add or edit. Every change is versioned and audited by the list API.
export function LibraryList({ listKey }: { listKey: ListKey }) {
  const def = LIST_DEFS[listKey];
  const toast = useToast();
  const { run, pending } = useSubmitOnce();
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [used, setUsed] = useState<Record<string, number> | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [reorder, setReorder] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [shown, setShown] = useState(PAGE);

  const load = useCallback(() => {
    getList(listKey)
      .then(setItems)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [listKey]);
  useEffect(load, [load]);
  useEffect(() => {
    if (listKey === "medicines")
      getMedicineUsage()
        .then(setUsed)
        .catch(() => setUsed(null));
  }, [listKey]);

  const apply = async (work: () => Promise<ListItem[]>, done: string): Promise<boolean> =>
    (await run(async () => {
      try {
        setItems(await work());
        toast({ text: done });
        return true;
      } catch (err) {
        toast({ text: problemText(err), tone: "error" });
        if (err instanceof ApiError && err.status === 409) load();
        return false;
      }
    })) ?? false;

  const counts = useMemo(() => countFilters(listKey, items ?? []), [listKey, items]);
  const rows = useMemo(
    () => filterItems(listKey, items ?? [], reorder ? "all" : filter, reorder ? "" : query),
    [listKey, items, filter, query, reorder],
  );
  const heads = ["Name", ...columnsFor(listKey).map((c) => c.head), "Actions"];
  const chips: [LibraryFilter, string][] = [["all", `All ${counts.all}`]];
  if (listKey === "medicines") chips.push(["review", `Needs review ${counts.review}`]);
  chips.push(["hidden", `Hidden ${counts.hidden}`]);

  return (
    <section className="card library-panel" aria-labelledby={`lib-${listKey}`}>
      <div className="library-top">
        <div>
          <h2 id={`lib-${listKey}`}>{def.title}</h2>
          <p className="muted small">{def.help}</p>
        </div>
        <div className="library-top-actions">
          <button
            type="button"
            className="btn"
            aria-pressed={reorder}
            disabled={pending || (items?.length ?? 0) < 2}
            onClick={() => setReorder(!reorder)}
          >
            {reorder ? "Done reordering" : "Reorder"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setDrawer({ mode: "add" })}
          >
            + Add {def.itemName}
          </button>
        </div>
      </div>
      {!reorder ? (
        <div className="library-filters">
          <TextInput
            type="search"
            aria-label={`Search ${def.title.toLowerCase()}`}
            placeholder={`Search ${def.title.toLowerCase()}`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
          />
          <div className="library-chips" role="group" aria-label="Show">
            {chips.map(([id, text]) => (
              <button
                key={id}
                type="button"
                className={`pill${filter === id ? " pill-on" : ""}`}
                aria-pressed={filter === id}
                onClick={() => {
                  setFilter(id);
                  setShown(PAGE);
                }}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="notice" role="status">
          Reordering: use the arrows. The order is saved at each step.
        </p>
      )}
      {problem ? (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      ) : null}
      {items === null && !problem ? <p className="muted">Loading...</p> : null}
      {items && rows.length === 0 ? (
        <p className="list-empty muted">
          {items.length === 0
            ? "Nothing in this list yet."
            : "Nothing matches. Clear the search or filter."}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <>
          <div className="library-head" aria-hidden="true" data-cols={heads.length}>
            {heads.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <ol className="library-rows" data-cols={heads.length}>
            {rows.slice(0, reorder ? rows.length : shown).map((item, i) => (
              <LibraryRow
                key={item.id}
                listKey={listKey}
                item={item}
                used={used ? (used[item.label.toLowerCase()] ?? 0) : undefined}
                reorder={reorder}
                first={i === 0}
                last={i === rows.length - 1}
                busy={pending}
                onEdit={() => setDrawer({ mode: "edit", item })}
                onActive={() =>
                  void apply(
                    () => setItemActive(listKey, item, !item.active),
                    item.active ? `"${item.label}" is hidden.` : `"${item.label}" is shown again.`,
                  )
                }
                onMove={(d) => void apply(() => moveItem(listKey, item, d), "Order saved.")}
              />
            ))}
          </ol>
          {!reorder && rows.length > shown ? (
            <button type="button" className="btn" onClick={() => setShown(shown + PAGE)}>
              Show more ({rows.length - shown} left)
            </button>
          ) : null}
        </>
      ) : null}
      <LibraryDrawer
        listKey={listKey}
        state={drawer}
        onClose={() => setDrawer(null)}
        onAdd={(input: ListItemInput) =>
          apply(() => addItem(listKey, input), `"${input.label}" added.`)
        }
        onEdit={(item, input) =>
          apply(() => updateItem(listKey, item, input), `"${input.label}" saved.`)
        }
      />
    </section>
  );
}

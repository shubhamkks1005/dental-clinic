import {
  LIST_DEFS,
  type ListDef,
  type ListItem,
  type ListItemInput,
  type ListKey,
} from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { useSubmitOnce } from "../../ui/submit-guard";
import { useToast } from "../../ui/Toast";
import { useMe } from "../auth";
import { addItem, getList, moveItem, setItemActive, updateItem } from "./api";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRow";
import "./lists.css";

// 1.5.4 THE editor for every simple list (S12 frame). Everything shown comes from the list's
// config in packages/shared/src/lists.ts; a new list needs no new screen.
export function ListEditor({ listKey }: { listKey: ListKey }) {
  const def: ListDef = LIST_DEFS[listKey];
  const canEdit = useMe().permissions.includes("settings.write");
  const toast = useToast();
  const { run, pending } = useSubmitOnce();
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(() => {
    getList(listKey)
      .then(setItems)
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [listKey]);
  useEffect(load, [load]);

  // Runs one change; the reply is the fresh list. A stale page (409) reloads the list.
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

  const name = (input: ListItemInput) => `"${input.label}"`;
  return (
    <section className="card settings-panel" aria-labelledby={`list-${listKey}`}>
      <h2 id={`list-${listKey}`}>{def.title}</h2>
      <p className="muted">{def.help}</p>
      {problem && (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      )}
      {items === null && !problem && <p className="muted">Loading...</p>}
      {items?.length === 0 && <p className="list-empty muted">Nothing in this list yet.</p>}
      {items && items.length > 0 && (
        <ol className="item-list">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              listKey={listKey}
              item={item}
              canEdit={canEdit}
              first={i === 0}
              last={i === items.length - 1}
              busy={pending}
              onSave={(input) =>
                apply(() => updateItem(listKey, item, input), `${name(input)} saved.`)
              }
              onActive={(active) =>
                void apply(
                  () => setItemActive(listKey, item, active),
                  active ? `"${item.label}" is shown again.` : `"${item.label}" is hidden.`,
                )
              }
              onMove={(direction) =>
                void apply(() => moveItem(listKey, item, direction), "Order saved.")
              }
            />
          ))}
        </ol>
      )}
      {canEdit ? (
        <div className="list-add">
          <h3>Add a {def.itemName}</h3>
          <ItemForm
            listKey={listKey}
            submitLabel="Add"
            onSubmit={(input) => apply(() => addItem(listKey, input), `${name(input)} added.`)}
          />
        </div>
      ) : (
        <p className="small muted list-note">Only the doctor can change this list.</p>
      )}
    </section>
  );
}

import type { ListItem, ListItemInput, ListKey } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import {
  addItemWithReply,
  getList,
  hideMedicine,
  moveItem,
  moveItemTo,
  setItemActive,
  updateItem,
} from "../lists";
import { getMedicineUsage } from "./api";
import type { Usage } from "./library-view";

export const CHANGED_RELOADED = "This item was changed. Reloaded.";

// Last lists seen, so a tab shows at once while it refreshes (the server reply always wins).
const cache = new Map<ListKey, ListItem[]>();

/** The list a tab needs beside its own: medicines need the sets (hide dialog), sets the medicines. */
export const companionOf = (key: ListKey): ListKey | null =>
  key === "medicines" ? "medicine_sets" : key === "medicine_sets" ? "medicines" : null;

export type SaveResult =
  { ok: true; item: ListItem | null; items: ListItem[] } | { ok: false; problem: string };

// Library data and writes. Saves wait for the server (never optimistic: content and fees).
// Hide / Show again and order change the screen at once and roll back with a sentence (Part S).
export function useLibraryData(listKey: ListKey) {
  const toast = useToast();
  const companionKey = companionOf(listKey);
  const [items, setItemsState] = useState<ListItem[] | null>(cache.get(listKey) ?? null);
  const [companion, setCompanionState] = useState<ListItem[] | null>(
    companionKey ? (cache.get(companionKey) ?? null) : null,
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);
  const changes = useRef(0);

  const setItems = useCallback(
    (next: ListItem[]) => {
      cache.set(listKey, next);
      setItemsState(next);
    },
    [listKey],
  );
  const setCompanion = useCallback(
    (next: ListItem[]) => {
      if (companionKey) cache.set(companionKey, next);
      setCompanionState(next);
    },
    [companionKey],
  );

  const load = useCallback(() => {
    setProblem(null);
    const started = changes.current;
    // One round: the list and its companion in parallel (no waterfall).
    void Promise.all([getList(listKey), companionKey ? getList(companionKey) : null])
      .then(([own, other]) => {
        // Stale refresh guard: a local change after this load started wins.
        if (changes.current !== started) return;
        setItems(own);
        if (other) setCompanion(other);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, [listKey, companionKey, setItems, setCompanion]);

  useEffect(load, [load]);
  useEffect(() => {
    if (listKey !== "medicines") return;
    getMedicineUsage()
      .then(setUsage)
      .catch(() => setUsageFailed(true));
  }, [listKey]);

  const refused = useCallback(
    (err: unknown, before: ListItem[]) => {
      setItems(before);
      if (err instanceof ApiError && err.status === 409) {
        toast({ text: CHANGED_RELOADED, tone: "error" });
        load();
      } else toast({ text: problemText(err), tone: "error" });
    },
    [load, setItems, toast],
  );

  /** Add or edit. Failure keeps the form; a 409 reloads the list. */
  async function save(input: ListItemInput, item?: ListItem): Promise<SaveResult> {
    changes.current++;
    try {
      if (item) {
        const next = await updateItem(listKey, item, input);
        setItems(next);
        return { ok: true, item: next.find((i) => i.id === item.id) ?? null, items: next };
      }
      const reply = await addItemWithReply(listKey, input);
      setItems(reply.items);
      return { ok: true, item: reply.item, items: reply.items };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        load();
        return { ok: false, problem: CHANGED_RELOADED };
      }
      return { ok: false, problem: problemText(err) };
    }
  }

  /** Add a medicine from the set editor ("Add it to Medicines first"). */
  async function addMedicine(input: ListItemInput): Promise<SaveResult> {
    try {
      const reply = await addItemWithReply("medicines", input);
      setCompanion(reply.items);
      return { ok: true, item: reply.item, items: reply.items };
    } catch (err) {
      return { ok: false, problem: problemText(err) };
    }
  }

  async function setActive(item: ListItem, active: boolean): Promise<boolean> {
    if (!items) return false;
    const before = items;
    changes.current++;
    setItems(items.map((i) => (i.id === item.id ? { ...i, active } : i)));
    try {
      setItems(await setItemActive(listKey, item, active));
      return true;
    } catch (err) {
      refused(err, before);
      return false;
    }
  }

  async function hideWithSets(item: ListItem, removeFromSets: boolean) {
    if (!items) return null;
    const before = items;
    changes.current++;
    setItems(items.map((i) => (i.id === item.id ? { ...i, active: false } : i)));
    try {
      const reply = await hideMedicine(item, removeFromSets);
      setItems(reply.items);
      setCompanion(reply.sets);
      return reply;
    } catch (err) {
      refused(err, before);
      return null;
    }
  }

  /** Optimistic order: the screen moves first; the server reply (or a rollback) follows. */
  async function reorder(next: ListItem[], call: () => Promise<ListItem[]>): Promise<boolean> {
    if (!items) return false;
    const before = items;
    changes.current++;
    setItems(next);
    try {
      setItems(await call());
      return true;
    } catch (err) {
      refused(err, before);
      return false;
    }
  }

  const move = (item: ListItem, direction: "up" | "down", next: ListItem[]) =>
    reorder(next, () => moveItem(listKey, item, direction));
  const moveTo = (item: ListItem, position: number, next: ListItem[]) =>
    reorder(next, () => moveItemTo(listKey, item, position));

  return {
    items,
    companion,
    problem,
    usage,
    usageFailed,
    load,
    save,
    addMedicine,
    setActive,
    hideWithSets,
    move,
    moveTo,
  };
}

export type LibraryData = ReturnType<typeof useLibraryData>;

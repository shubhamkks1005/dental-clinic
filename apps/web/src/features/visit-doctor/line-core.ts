import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { createKeyedQueue } from "./line-state";

export const UNDO_MS = 6000; // owner decision Q9: the Undo toast hides after 6 s

export type SaveState = "saved" | "saving" | "error";
export type UndoToast = { text: string; run: () => void };

export const sentence = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

/** A list that updates at once: jobs read `ref.current` (the latest), not the value of one render. */
export function useListRef<T>(initial: () => T[]) {
  const [list, setList] = useState<T[]>(initial);
  const ref = useRef<T[]>(list);
  const set = useCallback((fn: (prev: T[]) => T[]) => {
    ref.current = fn(ref.current);
    setList(ref.current);
  }, []);
  return [list, set, ref] as const;
}

export type LineCore = ReturnType<typeof useLineCore>;

/**
 * What the diagnosis and the procedure lines share: the one-step Undo toast (6 s), the Saving or
 * Saved text, the one plain sentence on a refusal, and the per-line job queue.
 */
export function useLineCore() {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoToast | null>(null);
  const queue = useRef(createKeyedQueue()).current;
  const busy = useRef(0);
  const failed = useRef(false);
  const undoTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const showUndo = useCallback((text: string, run: () => void) => {
    window.clearTimeout(undoTimer.current);
    setUndo({ text, run });
    undoTimer.current = window.setTimeout(() => setUndo(null), UNDO_MS);
  }, []);

  const runUndo = useCallback(() => {
    window.clearTimeout(undoTimer.current);
    setUndo((u) => {
      u?.run();
      return null;
    });
  }, []);

  /** One server call, in order for its key. A refusal puts the screen back and says why. */
  async function send<T>(
    key: string,
    job: () => Promise<T>,
    putBack: () => void,
    fallback: string,
  ): Promise<T | undefined> {
    busy.current += 1;
    setSaveState("saving");
    try {
      const out = await queue(key, job);
      failed.current = false;
      return out;
    } catch (err) {
      failed.current = true;
      putBack();
      setError(sentence(err, fallback));
      return undefined;
    } finally {
      busy.current -= 1;
      if (busy.current === 0) {
        setSaveState(failed.current ? "error" : "saved");
        if (!failed.current) setSavedAt(new Date());
      }
    }
  }

  return {
    send,
    showUndo,
    runUndo,
    undo,
    saveState,
    savedAt,
    error,
    setError,
    clearError: () => setError(null),
  };
}

export { ApiError };

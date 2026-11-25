import type { ToothHistoryEntry } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { getToothHistory, saveToothNote, type ToothHistoryData } from "./tooth-api";

type State = {
  loading: boolean;
  error: string | null;
  data: ToothHistoryData | null;
  entries: ToothHistoryEntry[];
};

/**
 * History of the tooth in the card: the first page comes with the card, "Show older" adds the next.
 * Pages are kept per tooth for the life of the visit (the doctor goes back and forth), and dropped
 * when this visit saves something new on that tooth (`refresh`).
 */
export function useToothHistory(patientId: string, visitId: string, tooth: number | null) {
  const cache = useRef(new Map<number, State>());
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    data: null,
    entries: [],
  });
  const [older, setOlder] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(
    (fdi: number, force = false) => {
      const hit = cache.current.get(fdi);
      if (hit && !force) {
        setState(hit);
        return;
      }
      const mine = ++seq.current;
      setState({ loading: true, error: null, data: null, entries: [] });
      getToothHistory(patientId, fdi)
        .then((data) => {
          const next = { loading: false, error: null, data, entries: data.entries };
          cache.current.set(fdi, next);
          if (mine === seq.current) setState(next);
        })
        .catch((err: unknown) => {
          if (mine !== seq.current) return;
          setState({
            loading: false,
            error: err instanceof ApiError ? err.message : "Could not load this tooth. Try again.",
            data: null,
            entries: [],
          });
        });
    },
    [patientId],
  );

  useEffect(() => {
    setNoteError(null);
    if (tooth !== null) load(tooth);
  }, [tooth, load]);

  async function showOlder() {
    const cur = state.data;
    if (tooth === null || !cur?.next) return;
    setOlder(true);
    try {
      const page = await getToothHistory(patientId, tooth, cur.next);
      const merged: State = {
        loading: false,
        error: null,
        data: { ...cur, next: page.next },
        entries: [...state.entries, ...page.entries],
      };
      cache.current.set(tooth, merged);
      setState(merged);
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof ApiError ? err.message : "Could not load older entries.",
      }));
    } finally {
      setOlder(false);
    }
  }

  /** Save the note (empty text clears it). Returns true when it was saved. */
  async function saveNote(text: string): Promise<boolean> {
    if (tooth === null) return false;
    setNoteBusy(true);
    setNoteError(null);
    try {
      const r = await saveToothNote(patientId, tooth, {
        visitId,
        body: text,
        version: state.data?.note?.version ?? null,
      });
      cache.current.delete(tooth);
      setState((s) => (s.data ? { ...s, data: { ...s.data, note: r.note } } : s));
      return true;
    } catch (err) {
      setNoteError(err instanceof ApiError ? err.message : "Could not save the note. Try again.");
      return false;
    } finally {
      setNoteBusy(false);
    }
  }

  return {
    ...state,
    older,
    showOlder,
    noteBusy,
    noteError,
    saveNote,
    /** A new mark, line or file was saved on this tooth: read it again. */
    refresh: () => tooth !== null && load(tooth, true),
  };
}

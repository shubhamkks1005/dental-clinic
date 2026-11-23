import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { useOnline } from "../../ui/use-online";
import { patchVisit, type VisitSummary } from "./api";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MIN_INTERVAL_MS,
  diffVisitNotes,
  type NotesSnapshot,
  type SaveStatus,
} from "./visit-autosave";

type Args = {
  visitId: string;
  version: number;
  form: NotesSnapshot;
  saved: NotesSnapshot;
  enabled: boolean;
  onSaved: (visit: VisitSummary, snapshot: NotesSnapshot) => void;
  onVersion: (version: number) => void;
};

/**
 * 3.5.5: debounce 1.5s, at most one save per 5s, keep pending while offline, retry on error.
 */
export function useVisitAutosave({
  visitId,
  version,
  form,
  saved,
  enabled,
  onSaved,
  onVersion,
}: Args): { status: SaveStatus; dirty: boolean } {
  const online = useOnline();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const versionRef = useRef(version);
  const formRef = useRef(form);
  const savedRef = useRef(saved);
  const enabledRef = useRef(enabled);
  const visitIdRef = useRef(visitId);
  const onSavedRef = useRef(onSaved);
  const onVersionRef = useRef(onVersion);
  const lastSaveAt = useRef(0);
  const inflight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Q1.6: after a version conflict stop trying; the doctor reloads and merges by hand.
  const conflict = useRef(false);

  versionRef.current = version;
  formRef.current = form;
  savedRef.current = saved;
  enabledRef.current = enabled;
  visitIdRef.current = visitId;
  onSavedRef.current = onSaved;
  onVersionRef.current = onVersion;

  const dirty = diffVisitNotes(version, form, saved) !== null;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  async function flush() {
    if (!enabledRef.current || inflight.current || conflict.current) return;
    const snapshot = { ...formRef.current };
    const patch = diffVisitNotes(versionRef.current, snapshot, savedRef.current);
    if (!patch) {
      setStatus("saved");
      return;
    }
    if (!navigator.onLine) {
      setStatus("dirty");
      return;
    }
    const elapsed = Date.now() - lastSaveAt.current;
    if (elapsed < AUTOSAVE_MIN_INTERVAL_MS && lastSaveAt.current > 0) {
      const wait = AUTOSAVE_MIN_INTERVAL_MS - elapsed;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, wait);
      setStatus("dirty");
      return;
    }

    inflight.current = true;
    setStatus("saving");
    try {
      const next = await patchVisit(visitIdRef.current, patch);
      lastSaveAt.current = Date.now();
      onVersionRef.current(next.version);
      onSavedRef.current(next, snapshot);
      setStatus(diffVisitNotes(next.version, formRef.current, snapshot) ? "dirty" : "saved");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        conflict.current = true;
        setStatus("conflict");
        return;
      }
      setStatus("error");
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => {
        void flush();
      }, AUTOSAVE_MIN_INTERVAL_MS);
    } finally {
      inflight.current = false;
    }
  }

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    if (!enabled) return;
    if (!dirty && !conflict.current) {
      setStatus("saved");
      return;
    }
    setStatus((s) => (s === "saving" || s === "conflict" ? s : "dirty"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flushRef.current();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, saved, enabled, dirty, visitId]);

  useEffect(() => {
    if (online && dirtyRef.current && enabledRef.current) void flushRef.current();
  }, [online]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return { status, dirty };
}

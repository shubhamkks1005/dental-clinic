import type { AnnotationItem, FileAnnotations } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../api/client";
import { push, redo, trail, undo, type Trail } from "./xray-model";

type Saved = { fileId: string; version: number; annotations: FileAnnotations | null };

const EMPTY: FileAnnotations = { v: 1, scale: null, items: [] };

/**
 * Marks of one picture (handoff B8): read with the file version, saved with that version, so two
 * tabs cannot overwrite each other. Undo and redo walk the marks; teeth, note and scale ride along.
 */
export function useXrayAnnotations(fileId: string | null, canEdit: boolean) {
  const [doc, setDoc] = useState<Trail<FileAnnotations>>(trail(EMPTY));
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [dirty, setDirty] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setError(null);
    setDirty(false);
    setDoc(trail(EMPTY));
    if (!fileId) return;
    let live = true;
    setLoading(true);
    api<Saved>(`/api/staff/files/${fileId}/annotations`)
      .then((r) => {
        if (!live) return;
        setVersion(r.version);
        setDoc(trail(r.annotations ?? EMPTY));
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof ApiError ? err.message : "Could not load the marks.");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [fileId]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const change = useCallback((fn: (a: FileAnnotations) => FileAnnotations) => {
    setDoc((t) => push(t, fn(t.present)));
    setDirty(true);
  }, []);

  const a = doc.present;
  return {
    annotations: a,
    items: a.items as AnnotationItem[],
    loading,
    error,
    saving,
    saved: toast,
    dirty,
    canUndo: doc.past.length > 0,
    canRedo: doc.future.length > 0,
    version,
    addItem: (item: AnnotationItem) =>
      canEdit && change((x) => ({ ...x, items: [...x.items, item] })),
    removeItem: (id: string) =>
      canEdit && change((x) => ({ ...x, items: x.items.filter((i) => i.id !== id) })),
    setScale: (scale: FileAnnotations["scale"]) => canEdit && change((x) => ({ ...x, scale })),
    setTeeth: (teeth: number[]) =>
      canEdit && change((x) => ({ ...x, teeth: teeth as FileAnnotations["teeth"] })),
    setNote: (note: string) => canEdit && change((x) => ({ ...x, note })),
    undo: () => {
      setDoc(undo);
      setDirty(true);
    },
    redo: () => {
      setDoc(redo);
      setDirty(true);
    },
    reset: () => canEdit && change(() => EMPTY),
    async save() {
      if (!fileId || !canEdit) return;
      setSaving(true);
      setError(null);
      try {
        const r = await api<Saved>(`/api/staff/files/${fileId}/annotations`, {
          method: "PUT",
          body: { version, annotations: a },
        });
        setVersion(r.version);
        setDirty(false);
        setToast(true);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(false), 2200);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Could not save the marks. Check the connection.",
        );
      } finally {
        setSaving(false);
      }
    },
  };
}

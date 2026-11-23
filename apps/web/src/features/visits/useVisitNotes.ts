import { expandQuickPhrase, type ListItem } from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
import type { VisitSummary } from "./api";
import { useVisitAutosave } from "./useVisitAutosave";
import { type NotesSnapshot } from "./visit-autosave";

export function notesFromVisit(v: VisitSummary): NotesSnapshot {
  return {
    chiefComplaint: v.chiefComplaint ?? "",
    historyNote: v.historyNote ?? "",
    examNote: v.examNote ?? "",
    gumCondition: v.gumCondition ?? "",
    advice: v.advice ?? "",
    nextVisitNote: v.nextVisitNote ?? "",
    bpSystolic: v.bpSystolic?.toString() ?? "",
    bpDiastolic: v.bpDiastolic?.toString() ?? "",
    pulse: v.pulse?.toString() ?? "",
  };
}

type Args = {
  visit: VisitSummary;
  phrases: ListItem[];
  readOnly: boolean;
  onSaved: (visit: VisitSummary) => void;
};

/** 3.5.3 + 3.5.5: the visit's note fields, quick phrases and autosave, shared by every layout. */
export function useVisitNotes({ visit, phrases, readOnly, onSaved }: Args) {
  const [form, setForm] = useState(() => notesFromVisit(visit));
  const [saved, setSaved] = useState(() => notesFromVisit(visit));
  const [version, setVersion] = useState(visit.version);

  useEffect(() => {
    const snap = notesFromVisit(visit);
    setForm(snap);
    setSaved(snap);
    setVersion(visit.version);
    // Only a different visit resets the form; a save must not overwrite what is being typed.
  }, [visit.id]);

  const phraseMap = useMemo(
    () =>
      phrases
        .filter((p) => p.active)
        .map((p) => ({ trigger: p.label, text: String(p.data.text ?? "") }))
        .filter((p) => p.text),
    [phrases],
  );

  const { status, dirty } = useVisitAutosave({
    visitId: visit.id,
    version,
    form,
    saved,
    enabled: !readOnly,
    onVersion: setVersion,
    onSaved: (next, snapshot) => {
      setSaved(snapshot);
      onSaved(next);
    },
  });

  /** Plain field (numbers, short inputs). */
  const setField = (key: keyof NotesSnapshot, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  /** Text field that expands ;quick phrases. */
  const setPhrase = (key: keyof NotesSnapshot, raw: string) =>
    setForm((f) => ({ ...f, [key]: expandQuickPhrase(raw, phraseMap).value }));

  return { form, status, dirty, setField, setPhrase };
}

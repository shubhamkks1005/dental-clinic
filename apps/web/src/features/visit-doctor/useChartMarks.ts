import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatientChart, type PatientChart } from "../chart/api";
import { saveMarks } from "./chart-api";
import { withMarks, type Mark } from "./chart-model";

export const AUTOSAVE_MS = 1500;

type Args = {
  patientId: string;
  visitId: string;
  /** Called after marks were saved, so the tooth card reads the tooth again. */
  onSaved: () => void;
};

/**
 * Chart marks: they show at once, are collected, saved together a moment later (autosave) or when
 * the doctor presses Save, and can be undone while they are still unsaved.
 */
export function useChartMarks({ patientId, visitId, onSaved }: Args) {
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [asOf, setAsOf] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const marksRef = useRef<Mark[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    setError(null);
    getPatientChart(patientId, { asOfVisitId: asOf || undefined, highlightVisitId: visitId })
      .then((c) => live && setChart(c))
      .catch((err: unknown) => {
        if (live)
          setError(err instanceof ApiError ? err.message : "Could not load the tooth chart.");
      });
    return () => {
      live = false;
    };
  }, [patientId, visitId, asOf]);

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (busy.current || marksRef.current.length === 0) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    const sending = marksRef.current;
    try {
      const r = await saveMarks(patientId, visitId, sending);
      // Marks made while this request ran stay pending for the next save.
      marksRef.current = marksRef.current.slice(sending.length);
      setMarks(marksRef.current);
      setChart(r.chart);
      setSavedAt(new Date());
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the chart marks. They are kept: try Save again.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
      if (marksRef.current.length > 0)
        timer.current = window.setTimeout(() => void save(), AUTOSAVE_MS);
    }
  }, [patientId, visitId, onSaved]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setPending = (next: Mark[]) => {
    marksRef.current = next;
    setMarks(next);
    window.clearTimeout(timer.current);
    if (next.length > 0) timer.current = window.setTimeout(() => void save(), AUTOSAVE_MS);
  };

  return {
    chart,
    cells: chart ? withMarks(chart.cells, marks) : [],
    asOf,
    setAsOf,
    pending: marks.length,
    saving,
    savedAt,
    error,
    addMark: (m: Mark) => setPending([...marksRef.current, m]),
    undo: () => setPending(marksRef.current.slice(0, -1)),
    save,
    state: saving
      ? ("saving" as const)
      : marks.length > 0
        ? ("pending" as const)
        : ("saved" as const),
  };
}

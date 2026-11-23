import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatient, type PatientDetail } from "../patients";
import { getVisit, listRecentVisits, type VisitRecent, type VisitSummary } from "./api";

/** Loads the visit, its patient and the last visits. `setVisit` takes every later change. */
export function useVisitData(id: string | undefined) {
  const [visit, setVisit] = useState<VisitSummary | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [recent, setRecent] = useState<VisitRecent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    setVisit(null);
    setPatient(null);
    setRecent([]);
    getVisit(id)
      .then(async (row) => {
        if (cancelled) return;
        setVisit(row);
        const [p, list] = await Promise.all([
          getPatient(row.patientId),
          listRecentVisits(row.patientId, 3),
        ]);
        if (cancelled) return;
        setPatient(p);
        setRecent(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this visit. Check the connection, then try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { visit, patient, recent, error, setVisit };
}

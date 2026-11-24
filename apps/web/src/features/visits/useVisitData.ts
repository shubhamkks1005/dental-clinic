import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getPatient, type PatientDetail } from "../patients";
import { useRequestScope } from "../../ui/RequestScope";
import { getVisit, listRecentVisits, type VisitRecent, type VisitSummary } from "./api";
import { prefetchForVisit, prefetchOnOpen, type VisitAccess } from "./visit-prefetch";

/**
 * Loads the visit, its patient and the last visits. `setVisit` takes every later change.
 * Two rounds: getVisit (with the lists), then the patient and every panel's request together.
 */
export function useVisitData(id: string | undefined, access: VisitAccess) {
  const scope = useRequestScope();
  const { canViewClinical, canEdit, canWriteRx } = access;
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
    const rights = { canViewClinical, canEdit, canWriteRx };
    prefetchOnOpen(scope, id, rights);
    getVisit(id)
      .then(async (row) => {
        if (cancelled) return;
        setVisit(row);
        prefetchForVisit(scope, row, rights);
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
  }, [id, scope, canViewClinical, canEdit, canWriteRx]);

  return { visit, patient, recent, error, setVisit };
}

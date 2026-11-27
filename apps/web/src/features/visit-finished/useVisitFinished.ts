import { useCallback, useEffect, useRef, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { getBill, type BillDto } from "../billing/api";
import { getPatient, type PatientDetail } from "../patients";
import { listVisitPrescriptions, type PrescriptionDto } from "../prescriptions";
import { getVisitAfter, startInvoice, type VisitAfterDto } from "./api";

export type Part<T> =
  { state: "loading" } | { state: "error"; message: string } | { state: "ok"; data: T };

/** The prescription shown: the newest issued/revised one, else the draft, else none. */
export function pickRx(list: PrescriptionDto[]): PrescriptionDto | null {
  const done = list.filter((p) => p.status !== "draft");
  return done[done.length - 1] ?? list.find((p) => p.status === "draft") ?? null;
}

// One round on open: the "after" read, the prescriptions and the patient in parallel (rule S: no
// waterfall). A visit with procedures and no invoice gets its draft made once (brief section 14).
// While visible, the after read refreshes every 30 s; a failed refresh keeps the old data.
export function useVisitFinished(visitId: string) {
  const [after, setAfter] = useState<Part<VisitAfterDto>>({ state: "loading" });
  const [rx, setRx] = useState<Part<PrescriptionDto | null>>({ state: "loading" });
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [bill, setBill] = useState<Part<BillDto | null>>({ state: "loading" });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const localChanges = useRef(0);

  const loadBill = useCallback(async (a: VisitAfterDto) => {
    try {
      if (a.bill) return setBill({ state: "ok", data: await getBill(a.bill.id) });
      if (a.procedures.length === 0) return setBill({ state: "ok", data: null });
      setBill({ state: "ok", data: await startInvoice(a.visit.id) });
    } catch (err) {
      setBill({ state: "error", message: problemText(err) });
    }
  }, []);

  const loadAll = useCallback(async () => {
    setAfter({ state: "loading" });
    setBill({ state: "loading" });
    const [a, r] = await Promise.allSettled([
      getVisitAfter(visitId),
      listVisitPrescriptions(visitId),
    ]);
    setRx(r.status === "fulfilled" ? { state: "ok", data: pickRx(r.value) } : fail(r.reason));
    if (a.status === "rejected") {
      setAfter(fail(a.reason));
      setBill(fail(a.reason));
      return;
    }
    setAfter({ state: "ok", data: a.value });
    setUpdatedAt(new Date());
    getPatient(a.value.visit.patientId)
      .then(setPatient)
      .catch(() => setPatient(null));
    await loadBill(a.value);
  }, [visitId, loadBill]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Quiet refresh: drop the answer if the doctor changed something while it ran (lessons).
  const refresh = useCallback(async () => {
    const mark = localChanges.current;
    try {
      const a = await getVisitAfter(visitId);
      if (mark !== localChanges.current) return;
      setAfter({ state: "ok", data: a });
      setUpdatedAt(new Date());
      setRefreshFailed(false);
    } catch {
      setRefreshFailed(true);
    }
  }, [visitId]);
  useVisibleInterval(() => void refresh(), 30_000);

  const reloadRx = useCallback(async () => {
    try {
      setRx({ state: "ok", data: pickRx(await listVisitPrescriptions(visitId)) });
    } catch (err) {
      setRx(fail(err));
    }
  }, [visitId]);

  return {
    after,
    rx,
    patient,
    bill,
    setBill: (b: BillDto | null) => {
      localChanges.current += 1;
      setBill({ state: "ok", data: b });
    },
    setRxData: (p: PrescriptionDto) => setRx({ state: "ok", data: p }),
    reloadRx,
    retry: loadAll,
    refresh,
    updatedAt,
    refreshFailed,
  };
}

function fail(err: unknown): { state: "error"; message: string } {
  return { state: "error", message: problemText(err) };
}

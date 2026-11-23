import { formatRupees } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { problemText } from "../../api/problem-text";
import { useToast } from "../../ui/Toast";
import {
  approveBillDiscount,
  dismissCancelRequest,
  listCancelRequests,
  listPendingDiscounts,
  type CancelRequest,
  type PendingDiscount,
} from "./api";

/** Q1.7 (DoctorToday.dc.html "Waiting for you"): discounts the desk asked for, approved in one click. */
export function WaitingForYou() {
  const toast = useToast();
  const [rows, setRows] = useState<PendingDiscount[]>([]);
  const [cancels, setCancels] = useState<CancelRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listPendingDiscounts()
      .then(setRows)
      .catch(() => setRows([]));
    listCancelRequests()
      .then(setCancels)
      .catch(() => setCancels([]));
  }, []);
  useEffect(load, [load]);

  async function approve(row: PendingDiscount) {
    setBusyId(row.billId);
    setError(null);
    try {
      await approveBillDiscount(row.billId, row.version);
      toast({
        text: `Discount of ${formatRupees(row.discountPaise)} approved for ${row.patientName}.`,
      });
      load();
    } catch (e: unknown) {
      setError(problemText(e));
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0 && cancels.length === 0 && !error) return null;
  return (
    <section className="card doctor-today-card" aria-label="Waiting for you">
      <h2>Waiting for you</h2>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="list-plain">
        {rows.map((r) => (
          <li key={r.billId} className="waiting-row">
            <span>
              <strong>Discount for {r.patientName}</strong>
              <span className="small muted">
                {" "}
                {formatRupees(r.discountPaise)}
                {r.reason ? ` · ${r.reason.replace("_", " ")}` : ""}
              </span>
            </span>
            <span className="today-actions">
              <Link className="btn btn-compact" to={`/app/bills/${r.billId}`}>
                Open bill
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-compact"
                disabled={busyId === r.billId}
                onClick={() => void approve(r)}
              >
                Approve
              </button>
            </span>
          </li>
        ))}
        {cancels.map((r) => (
          <li key={r.id} className="waiting-row">
            <span>
              <strong>
                Cancel bill {r.billNo ?? ""} for {r.patientName}
              </strong>
              <span className="small muted"> {r.reason}</span>
            </span>
            <span className="today-actions">
              <Link className="btn btn-primary btn-compact" to={`/app/bills/${r.billId}`}>
                Open bill
              </Link>
              <button
                type="button"
                className="btn btn-compact"
                disabled={busyId === r.id}
                onClick={() => {
                  setBusyId(r.id);
                  dismissCancelRequest(r.id)
                    .then(load)
                    .catch((e: unknown) => setError(problemText(e)))
                    .finally(() => setBusyId(null));
                }}
              >
                Dismiss
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

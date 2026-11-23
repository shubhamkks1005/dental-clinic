import { formatMoney } from "../../ui/format";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { problemText } from "../../api/problem-text";
import { TodoRows, type TodoItem } from "../../ui/page/TodoRows";
import { useToast } from "../../ui/Toast";
import {
  approveBillDiscount,
  dismissCancelRequest,
  listCancelRequests,
  listPendingDiscounts,
  type CancelRequest,
  type PendingDiscount,
} from "./api";

/**
 * Q1.7 / Q2.5 (DoctorToday.dc.html "Waiting for you"): one line per thing the doctor must decide.
 * Discounts and bill cancels come from billing; the caller adds its own lines (unfinished visits,
 * patient requests) through `extra`.
 */
export function WaitingForYou({ extra = [] }: { extra?: TodoItem[] }) {
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
        text: `Discount of ${formatMoney(row.discountPaise)} approved for ${row.patientName}.`,
      });
      load();
    } catch (e: unknown) {
      setError(problemText(e));
    } finally {
      setBusyId(null);
    }
  }

  const items: TodoItem[] = [
    ...rows.map((r): TodoItem => ({
      key: `d-${r.billId}`,
      kind: "DISCOUNT WAITING",
      tone: "warning",
      who: `${r.patientName} · ${formatMoney(r.discountPaise)} off`,
      note: r.reason ? `Reason: ${r.reason.replace("_", " ")}` : undefined,
      action: (
        <button
          type="button"
          className="btn btn-primary btn-compact"
          disabled={busyId === r.billId}
          onClick={() => void approve(r)}
        >
          Approve
        </button>
      ),
    })),
    ...cancels.map((r): TodoItem => ({
      key: `c-${r.id}`,
      kind: "BILL CANCEL ASKED",
      tone: "danger",
      who: `${r.patientName} · bill ${r.billNo ?? ""}`.trim(),
      note: r.reason,
      action: (
        <span className="today-actions">
          <Link className="btn btn-primary btn-compact" to={`/app/bills/${r.billId}`}>
            Open
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
      ),
    })),
    ...extra,
  ];

  return (
    <section className="card doctor-todo" aria-label="Waiting for you">
      <div className="doctor-card-head">
        <h2>Waiting for you</h2>
        {items.length > 0 ? <span className="count-chip">{items.length}</span> : null}
      </div>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="muted small">Nothing is waiting for you.</p>
      ) : (
        <TodoRows items={items} />
      )}
    </section>
  );
}

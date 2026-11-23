import { formatRupees } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  listPatientBills,
  listPatientPayments,
  type PatientBillRow,
  type PatientPaymentRow,
} from "./api";
import { PaymentsList } from "./PaymentsList";
import { PaymentTakeForm } from "./PaymentTakeForm";
import { RefundPanel } from "./RefundPanel";

/** S04/S17 Billing tab + S09 payment shortcuts. */
export function PatientBillingPanel({ patientId }: { patientId: string }) {
  const [bills, setBills] = useState<PatientBillRow[]>([]);
  const [due, setDue] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [payments, setPayments] = useState<PatientPaymentRow[]>([]);
  const [filter, setFilter] = useState<"all" | "issued" | "cancelled" | "draft">("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listPatientPayments(patientId)
      .then(setPayments)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load payments.");
      });
    listPatientBills(patientId)
      .then((r) => {
        setBills(r.bills);
        setDue(r.outstandingDuePaise);
        setAdvance(r.advancePaise);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load bills.");
      });
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="stack gap-md" aria-label="Billing">
      <header className="row wrap gap-sm align-center">
        <h2 className="title-sm">Account</h2>
        <p className="muted">
          Outstanding: <strong>{formatRupees(due)}</strong>
          {advance > 0 ? (
            <>
              {" "}
              · Advance: <strong>{formatRupees(advance)}</strong>
            </>
          ) : null}
        </p>
        <Link
          className="btn secondary"
          to={`/app/print/statement/${encodeURIComponent(patientId)}`}
          target="_blank"
          rel="noreferrer"
        >
          Print statement
        </Link>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <PaymentTakeForm
        patientId={patientId}
        duePaise={due}
        onDone={load}
        onError={(message) => setError(message || null)}
      />

      <RefundPanel patientId={patientId} onDone={load} />

      <div className="row wrap gap-sm" role="group" aria-label="Bill filter">
        {(["all", "issued", "draft", "cancelled"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? "btn" : "btn secondary"}
            style={{ minHeight: 44 }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {bills.length === 0 ? (
        <p className="muted">No bills yet. Create one from a visit.</p>
      ) : (
        <ul className="stack gap-sm list-plain">
          {bills
            .filter((b) => filter === "all" || b.status === filter)
            .map((b) => (
              <li key={b.id} className="surface card-pad row wrap gap-sm space-between">
                <div className="stack gap-xs">
                  <Link to={`/app/bills/${b.id}`}>{b.billNo ?? "Draft bill"}</Link>
                  <span className="muted small">
                    {b.billOn} · {b.status}
                    {b.kind === "opening_balance" ? " · opening" : ""}
                  </span>
                </div>
                <div className="stack gap-xs end">
                  <span>{formatRupees(b.totalPaise)}</span>
                  {b.duePaise > 0 ? (
                    <span className="muted small">Due {formatRupees(b.duePaise)}</span>
                  ) : null}
                </div>
              </li>
            ))}
        </ul>
      )}

      <h3 className="title-sm">Payments</h3>
      <PaymentsList payments={payments} />
    </section>
  );
}

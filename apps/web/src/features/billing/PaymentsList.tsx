import { formatRupees } from "@clinic/shared";
import { Link } from "react-router";
import type { PatientPaymentRow } from "./api";

/** Q1.3: payments with date, amount, mode, reference, the bill they paid, and a receipt link. */
export function PaymentsList({ payments }: { payments: PatientPaymentRow[] }) {
  if (payments.length === 0) return <p className="muted">No payments yet.</p>;
  return (
    <ul className="pay-list stack gap-sm list-plain" aria-label="Payments">
      {payments.map((p) => (
        <li key={p.id} className="surface card-pad row wrap gap-sm space-between">
          <div className="stack gap-xs">
            <strong>{formatRupees(p.amountPaise)}</strong>
            <span className="muted small">
              {p.dayLocal} · {p.mode}
              {p.splitMode && p.splitPaise ? ` + ${p.splitMode} ${formatRupees(p.splitPaise)}` : ""}
              {p.reference ? ` · ref ${p.reference}` : ""}
            </span>
            <span className="muted small">
              {p.appliedTo.length > 0 ? `Applied to ${p.appliedTo.join(", ")}` : "Advance"}
              {p.refundedPaise > 0 ? ` · refunded ${formatRupees(p.refundedPaise)}` : ""}
            </span>
          </div>
          {p.receiptNo ? (
            <Link
              className="btn secondary"
              to={`/app/print/receipt/${encodeURIComponent(p.id)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Print receipt ${p.receiptNo}`}
            >
              Print receipt {p.receiptNo}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

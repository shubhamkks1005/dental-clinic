import { amountInWords, billStatusKey, formatRupees } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { formatDate } from "../../ui/format";
import { StatusLabel } from "../../ui/StatusLabel";
import { BillCancelPanel } from "./BillCancelPanel";
import { BillDiscountPanel } from "./BillDiscountPanel";
import { BillDraftItems } from "./BillDraftItems";
import {
  getBill,
  issueBill,
  listPatientBills,
  listPatientPayments,
  type BillDto,
  type PatientPaymentRow,
} from "./api";
import "./billing.css";
import { BillCancelRequestPanel } from "./BillCancelRequestPanel";
import { PaymentsList } from "./PaymentsList";
import { PaymentTakeForm } from "./PaymentTakeForm";

/** S09 bill detail: issue draft, print link. */
export function BillScreen() {
  const { id = "" } = useParams();
  const [bill, setBill] = useState<BillDto | null>(null);
  const [advancePaise, setAdvancePaise] = useState(0);
  const [duePaise, setDuePaise] = useState(0);
  const [payments, setPayments] = useState<PatientPaymentRow[]>([]);
  const [applyAdvance, setApplyAdvance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    getBill(id)
      .then(async (b) => {
        setBill(b);
        try {
          const account = await listPatientBills(b.patientId);
          setAdvancePaise(account.advancePaise);
          setDuePaise(account.outstandingDuePaise);
          setApplyAdvance(account.advancePaise > 0);
          setPayments(await listPatientPayments(b.patientId));
        } catch {
          setAdvancePaise(0);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load bill."));
  }, [id]);

  useEffect(load, [load]);

  async function onIssue() {
    if (!bill) return;
    setBusy(true);
    setError(null);
    try {
      setBill(
        await issueBill(bill.id, bill.version, { applyAdvance: applyAdvance && advancePaise > 0 }),
      );
      // The balance changed with the new bill: reload it so the payment form appears at once.
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not issue bill.");
    } finally {
      setBusy(false);
    }
  }

  if (!bill && !error) return <p className="muted">Loading…</p>;
  if (!bill) return <p className="error-text">{error}</p>;

  return (
    <section className="bill-screen stack gap-md" aria-label="Bill">
      <header className="row wrap gap-sm space-between align-center">
        <div className="stack gap-xs">
          <h1 className="title-md">{bill.billNo ?? "Draft bill"}</h1>
          <p className="muted">
            {formatDate(bill.billOn)}{" "}
            <StatusLabel
              kind="bill"
              value={billStatusKey(bill.status, bill.totalPaise, bill.paidPaise ?? 0)}
            />
          </p>
        </div>
        <Link to={`/app/patients/${bill.patientId}?tab=billing`} className="btn secondary">
          Patient account
        </Link>
      </header>
      {error ? <p className="error-text">{error}</p> : null}

      {bill.status === "draft" ? (
        <BillDraftItems
          bill={bill}
          onUpdated={setBill}
          onError={(message) => setError(message || null)}
        />
      ) : (
        <ul className="stack gap-sm list-plain">
          {bill.items.map((item) => (
            <li key={item.id} className="row wrap space-between surface card-pad">
              <span>
                {item.procedureLabel}
                {item.toothFdi != null ? ` · tooth ${item.toothFdi}` : ""}
                {item.qty > 1 ? ` ×${item.qty}` : ""}
                {item.feeChangeReason ? ` · fee note: ${item.feeChangeReason}` : ""}
              </span>
              <span>{formatRupees(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="stack gap-xs surface card-pad">
        <div className="row space-between">
          <span>Subtotal</span>
          <span>{formatRupees(bill.subtotalPaise)}</span>
        </div>
        {bill.discountPaise > 0 ? (
          <div className="row space-between">
            <span>{bill.discountApprovedBy ? "Discount" : "Discount requested, not approved"}</span>
            <span>
              {bill.discountApprovedBy ? "-" : ""}
              {formatRupees(bill.discountPaise)}
            </span>
          </div>
        ) : null}
        {bill.taxPaise > 0 ? (
          <div className="row space-between">
            <span>Tax</span>
            <span>{formatRupees(bill.taxPaise)}</span>
          </div>
        ) : null}
        {bill.roundOffPaise !== 0 ? (
          <div className="row space-between">
            <span>Round-off</span>
            <span>{formatRupees(bill.roundOffPaise)}</span>
          </div>
        ) : null}
        <div className="row space-between">
          <strong>Total</strong>
          <strong>{formatRupees(bill.totalPaise)}</strong>
        </div>
        <p className="muted small">{amountInWords(bill.totalPaise)}</p>
        <p className="muted small">This is not a GST invoice (gst_mode off — DRAFT accountant).</p>
      </div>

      {bill.status === "issued" ? (
        <>
          <PaymentTakeForm
            patientId={bill.patientId}
            duePaise={duePaise}
            onDone={load}
            onError={(message) => setError(message || null)}
          />
          {bill.billNo ? (
            <>
              <h2 className="title-sm">Payments on this bill</h2>
              <PaymentsList payments={payments.filter((p) => p.appliedTo.includes(bill.billNo!))} />
            </>
          ) : null}
        </>
      ) : null}

      <BillDiscountPanel bill={bill} onUpdated={setBill} onError={(message) => setError(message)} />

      {bill.status === "draft" && advancePaise > 0 ? (
        <label className="row gap-sm align-center" style={{ minHeight: 44 }}>
          <input
            type="checkbox"
            checked={applyAdvance}
            onChange={(e) => setApplyAdvance(e.target.checked)}
          />
          <span>Apply patient advance ({formatRupees(advancePaise)}) to this bill</span>
        </label>
      ) : null}

      <div className="row wrap gap-sm">
        {bill.status === "draft" ? (
          <button
            type="button"
            className="btn"
            disabled={busy || (bill.discountPaise > 0 && !bill.discountApprovedBy)}
            onClick={() => void onIssue()}
          >
            Issue bill
          </button>
        ) : bill.status === "issued" ? (
          <Link className="btn" to={`/app/print/bill/${bill.id}`} target="_blank" rel="noreferrer">
            Print bill
          </Link>
        ) : null}
        {bill.status === "draft" && bill.discountPaise > 0 && !bill.discountApprovedBy ? (
          <p className="muted small" role="status">
            Waiting for the doctor to approve the discount.
          </p>
        ) : null}
        <BillCancelRequestPanel bill={bill} />
        <BillCancelPanel bill={bill} onUpdated={setBill} onError={setError} />
      </div>
    </section>
  );
}

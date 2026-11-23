import { amountInWords, formatRupees } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { BillCancelPanel } from "./BillCancelPanel";
import { BillDiscountPanel } from "./BillDiscountPanel";
import { BillDraftItems } from "./BillDraftItems";
import { getBill, issueBill, listPatientBills, type BillDto } from "./api";

/** S09 bill detail: issue draft, print link. */
export function BillScreen() {
  const { id = "" } = useParams();
  const [bill, setBill] = useState<BillDto | null>(null);
  const [advancePaise, setAdvancePaise] = useState(0);
  const [applyAdvance, setApplyAdvance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBill(id)
      .then(async (b) => {
        setBill(b);
        try {
          const account = await listPatientBills(b.patientId);
          setAdvancePaise(account.advancePaise);
          setApplyAdvance(account.advancePaise > 0);
        } catch {
          setAdvancePaise(0);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load bill."));
  }, [id]);

  async function onIssue() {
    if (!bill) return;
    setBusy(true);
    setError(null);
    try {
      setBill(
        await issueBill(bill.id, bill.version, { applyAdvance: applyAdvance && advancePaise > 0 }),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not issue bill.");
    } finally {
      setBusy(false);
    }
  }

  if (!bill && !error) return <p className="muted">Loading…</p>;
  if (!bill) return <p className="error-text">{error}</p>;

  return (
    <section className="stack gap-md" aria-label="Bill">
      <header className="row wrap gap-sm space-between align-center">
        <div className="stack gap-xs">
          <h1 className="title-md">{bill.billNo ?? "Draft bill"}</h1>
          <p className="muted">
            {bill.billOn} · {bill.status}
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
            <span>Discount</span>
            <span>-{formatRupees(bill.discountPaise)}</span>
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
        <BillCancelPanel bill={bill} onUpdated={setBill} onError={setError} />
      </div>
    </section>
  );
}

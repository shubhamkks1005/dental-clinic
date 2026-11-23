import { formatMoney } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../../ui/page/Page";
import { getPatient, type PatientDetail } from "../patients";
import { BillCancelPanel } from "./BillCancelPanel";
import { BillCancelRequestPanel } from "./BillCancelRequestPanel";
import { BillDiscountPanel } from "./BillDiscountPanel";
import { BillDraftItems } from "./BillDraftItems";
import { BillHeader } from "./BillHeader";
import { BillItemsCard } from "./BillItemsCard";
import { BillTotalsCard } from "./BillTotalsCard";
import {
  getBill,
  issueBill,
  listPatientBills,
  listPatientPayments,
  type BillDto,
  type PatientPaymentRow,
} from "./api";
import "./billing.css";
import "./bill-screen.css";
import { PaymentsList } from "./PaymentsList";
import { PaymentTakeForm } from "./PaymentTakeForm";

// Bill and payment (Bill.dc.html, PhoneBill.dc.html): items, payment and payments on the left,
// totals and discount on the right; one column on a phone.
export function BillScreen() {
  const { id = "" } = useParams();
  const [bill, setBill] = useState<BillDto | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
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
          setPatient(await getPatient(b.patientId));
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
  if (!bill) return <PageHeader title="Bill" subtitle={error} />;
  const waitingForDoctor =
    bill.status === "draft" && bill.discountPaise > 0 && !bill.discountApprovedBy;

  return (
    <section className="bill-screen" aria-label="Bill">
      <BillHeader bill={bill} patient={patient} />
      {error ? <p className="field-error">{error}</p> : null}

      <div className="bill-layout">
        <div className="bill-main">
          {bill.status === "draft" ? (
            <BillDraftItems
              bill={bill}
              onUpdated={setBill}
              onError={(message) => setError(message || null)}
            />
          ) : (
            <BillItemsCard bill={bill} />
          )}

          {bill.status === "issued" ? (
            <>
              <PaymentTakeForm
                patientId={bill.patientId}
                duePaise={duePaise}
                onDone={load}
                onError={(message) => setError(message || null)}
              />
              {bill.billNo ? (
                <section className="card bill-payments" aria-label="Payments on this bill">
                  <div className="bill-card-head">
                    <h2>Payments</h2>
                  </div>
                  <PaymentsList
                    payments={payments.filter((p) => p.appliedTo.includes(bill.billNo!))}
                  />
                </section>
              ) : null}
            </>
          ) : null}

          {bill.status === "draft" ? (
            <div className="bill-issue card">
              {advancePaise > 0 ? (
                <label className="bill-check">
                  <input
                    type="checkbox"
                    checked={applyAdvance}
                    onChange={(e) => setApplyAdvance(e.target.checked)}
                  />
                  <span>Apply patient advance ({formatMoney(advancePaise)}) to this bill</span>
                </label>
              ) : null}
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || waitingForDoctor}
                onClick={() => void onIssue()}
              >
                Issue bill
              </button>
              {waitingForDoctor ? (
                <p className="muted small" role="status">
                  Waiting for the doctor to approve the discount.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="bill-side">
          <BillTotalsCard bill={bill} />
          <BillDiscountPanel
            bill={bill}
            onUpdated={setBill}
            onError={(message) => setError(message)}
          />
          <details className="card bill-more">
            <summary>More actions</summary>
            <div className="bill-more-body">
              <Link to={`/app/patients/${bill.patientId}?tab=billing`} className="btn">
                Patient account
              </Link>
              <BillCancelRequestPanel bill={bill} />
              <BillCancelPanel bill={bill} onUpdated={setBill} onError={setError} />
            </div>
          </details>
        </aside>
      </div>
    </section>
  );
}

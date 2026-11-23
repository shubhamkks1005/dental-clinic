import { amountInWords, formatMoney } from "@clinic/shared";
import type { BillDto } from "./api";

// Totals card (Bill.dc.html): subtotal, discount, total, paid so far, balance and a bar.
export function BillTotalsCard({ bill }: { bill: BillDto }) {
  const paid = bill.paidPaise ?? 0;
  const balance = Math.max(0, bill.totalPaise - paid);
  const percent =
    bill.totalPaise > 0 ? Math.min(100, Math.round((paid / bill.totalPaise) * 100)) : 0;
  const issued = bill.status === "issued";
  return (
    <section className="card bill-totals" aria-label="Bill total">
      <p className="bill-label">BILL TOTAL</p>
      <dl>
        <div className="bill-line">
          <dt className="muted">Subtotal</dt>
          <dd>{formatMoney(bill.subtotalPaise)}</dd>
        </div>
        {bill.discountPaise > 0 ? (
          <div className="bill-line">
            <dt className="muted">
              {bill.discountApprovedBy ? "Discount" : "Discount requested, not approved"}
            </dt>
            <dd>
              {bill.discountApprovedBy ? "-" : ""}
              {formatMoney(bill.discountPaise)}
            </dd>
          </div>
        ) : null}
        {bill.taxPaise > 0 ? (
          <div className="bill-line">
            <dt className="muted">Tax</dt>
            <dd>{formatMoney(bill.taxPaise)}</dd>
          </div>
        ) : null}
        {bill.roundOffPaise !== 0 ? (
          <div className="bill-line">
            <dt className="muted">Round-off</dt>
            <dd>{formatMoney(bill.roundOffPaise)}</dd>
          </div>
        ) : null}
        <div className="bill-line bill-line-total">
          <dt>Total</dt>
          <dd>{formatMoney(bill.totalPaise)}</dd>
        </div>
        {issued ? (
          <>
            <div className="bill-line">
              <dt className="muted">Paid so far</dt>
              <dd>{formatMoney(paid)}</dd>
            </div>
            <div className="bill-line bill-line-balance">
              <dt>Balance</dt>
              <dd>{formatMoney(balance)}</dd>
            </div>
          </>
        ) : null}
      </dl>
      {issued ? (
        <div className="bill-bar" role="img" aria-label={`${percent} percent of the bill is paid`}>
          <span style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      <p className="muted small">{amountInWords(bill.totalPaise)}</p>
    </section>
  );
}

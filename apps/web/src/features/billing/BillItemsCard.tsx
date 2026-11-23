import { formatMoney } from "@clinic/shared";
import type { BillDto } from "./api";

// Items of an issued or cancelled bill (read only): item, qty, rate, amount.
export function BillItemsCard({ bill }: { bill: BillDto }) {
  return (
    <section className="card bill-items" aria-label="Items">
      <div className="bill-card-head">
        <h2>Items</h2>
        {bill.visitId ? <span className="muted small">Taken from the finalised visit</span> : null}
      </div>
      <div className="bill-item bill-item-head" aria-hidden="true">
        <span>ITEM</span>
        <span>QTY</span>
        <span className="bill-num">RATE</span>
        <span className="bill-num">AMOUNT</span>
      </div>
      <ul className="bill-item-list">
        {bill.items.map((item) => (
          <li key={item.id} className="bill-item">
            <span>
              <strong>{item.procedureLabel}</strong>
              {item.toothFdi != null || item.feeChangeReason ? (
                <span className="muted small bill-sub">
                  {item.toothFdi != null ? `Tooth ${item.toothFdi}` : ""}
                  {item.toothFdi != null && item.feeChangeReason ? " · " : ""}
                  {item.feeChangeReason ? `Fee note: ${item.feeChangeReason}` : ""}
                </span>
              ) : null}
            </span>
            <span>{item.qty}</span>
            <span className="bill-num">{formatMoney(item.unitPaise)}</span>
            <strong className="bill-num">{formatMoney(item.lineTotalPaise)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

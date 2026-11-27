import {
  DISCOUNT_REASONS,
  formatRupees,
  VISIT_MONEY_LABEL,
  type DiscountReason,
} from "@clinic/shared";
import { NativeInput, Radio, Select } from "../../ui/form";
import type { VisitAfterDto } from "./api";
import { arrivalText } from "./invoice-model";
import type { useInvoice } from "./useInvoice";

const REASON: Record<DiscountReason, string> = {
  hardship: "Hardship",
  staff_family: "Staff or family",
  courtesy: "Courtesy",
  settled: "Settled at visit end",
  other: "Other",
};

type Props = { inv: ReturnType<typeof useInvoice>; after: VisitAfterDto; readOnly: boolean };

// Money summary (HTML 734-791). Order: paid at arrival, subtotal, discount (always shown, also 0),
// invoice total, ONE line remaining / extra paid / nothing remaining, extra choice, earlier due.
export function MoneySummary({ inv, after, readOnly }: Props) {
  const arrival = arrivalText(after.arrival.items);
  return (
    <div className="vf-money">
      <div className="vf-money-arrival">
        <div className="vf-money-row">
          <span className="vf-muted">{inv.locked ? "Received" : "Paid at arrival"}</span>
          <span className="vf-mono vf-paid">
            {inv.locked
              ? `${formatRupees(inv.paid)} of ${formatRupees(inv.total)}`
              : formatRupees(inv.paid)}
          </span>
        </div>
        <span className="vf-muted vf-right">
          {inv.locked ? "" : arrival || "Nothing paid at arrival"}
        </span>
      </div>
      <div className="vf-money-row">
        <span className="vf-muted">Subtotal</span>
        <span className="vf-mono">
          {formatRupees(inv.locked ? inv.total + inv.discountPaise : inv.subtotal)}
        </span>
      </div>
      <div className="vf-money-row vf-wrap">
        <span className="vf-row">
          <label htmlFor="vf-discount" className="vf-discount-label">
            Discount
          </label>
          {!readOnly && inv.money.kind === "remaining" && (
            <button
              type="button"
              className="vf-btn vf-btn-small vf-btn-red"
              onClick={inv.remainingAsDiscount}
            >
              Remaining as discount
            </button>
          )}
        </span>
        <span className="vf-row">
          <span className="vf-discount-label">- ₹</span>
          <NativeInput
            id="vf-discount"
            className="vf-input vf-num vf-discount"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={inv.discountRupees}
            disabled={readOnly}
            aria-label="Discount amount in rupees"
            onChange={(e) => inv.setDiscountRupees(e.target.value)}
          />
        </span>
      </div>
      {!readOnly && inv.discountPaise > 0 && (
        <div className="vf-money-row">
          <label htmlFor="vf-reason" className="vf-muted">
            Discount reason
          </label>
          <Select id="vf-reason" value={inv.reason} onChange={(e) => inv.setReason(e.target.value)}>
            {DISCOUNT_REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON[r]}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="vf-money-row vf-total">
        <span className="vf-h2">Invoice total</span>
        <span className="vf-total-num">{formatRupees(inv.total)}</span>
      </div>
      <div className={`vf-money-row vf-balance vf-balance-${inv.money.kind}`}>
        <span>{VISIT_MONEY_LABEL[inv.money.kind]}</span>
        {inv.money.kind !== "none" && <span>{formatRupees(inv.money.amountPaise)}</span>}
      </div>
      {inv.money.kind === "extra" && !inv.locked && (
        <fieldset className="vf-extra">
          <legend>What should happen to the extra amount?</legend>
          <div className="vf-row">
            {(["returned", "advance"] as const).map((c) => (
              <label key={c} className="vf-radio">
                <Radio name="vf-extra" checked={inv.extra === c} onChange={() => inv.setExtra(c)} />
                <span>{c === "returned" ? "Returned to patient" : "Keep as advance"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {after.earlierDuesPaise > 0 && (
        <div className="vf-money-row">
          <span className="vf-muted">Earlier due</span>
          <span className="vf-mono">{formatRupees(after.earlierDuesPaise)}</span>
        </div>
      )}
    </div>
  );
}

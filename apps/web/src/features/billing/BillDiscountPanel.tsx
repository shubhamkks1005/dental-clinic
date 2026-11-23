import { DISCOUNT_REASONS, formatRupees, type DiscountReason } from "@clinic/shared";
import { useState } from "react";
import { useMe } from "../auth";
import { approveBillDiscount, requestBillDiscount, type BillDto } from "./api";

const REASON_LABEL: Record<DiscountReason, string> = {
  hardship: "Hardship",
  staff_family: "Staff or family",
  courtesy: "Courtesy",
  other: "Other",
};

type Props = {
  bill: BillDto;
  onUpdated: (bill: BillDto) => void;
  onError: (message: string) => void;
};

/** 5.3.6: request discount (any billing staff) + doctor approve. */
export function BillDiscountPanel({ bill, onUpdated, onError }: Props) {
  const me = useMe();
  const isDoctor = me.role === "doctor";
  const [rupees, setRupees] = useState("");
  const [reason, setReason] = useState<DiscountReason>("hardship");
  const [busy, setBusy] = useState(false);

  if (bill.status !== "draft") return null;

  const pending = bill.discountPaise > 0 && !bill.discountApprovedBy;

  async function request() {
    const paise = Math.round(Number(rupees) * 100);
    if (!Number.isFinite(paise) || paise <= 0) {
      onError("Enter a discount amount in rupees.");
      return;
    }
    setBusy(true);
    try {
      onUpdated(
        await requestBillDiscount(bill.id, {
          version: bill.version,
          discountPaise: paise,
          reason,
        }),
      );
      setRupees("");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Could not request discount.");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    try {
      onUpdated(await approveBillDiscount(bill.id, bill.version));
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Could not approve discount.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack gap-sm surface card-pad">
      <p className="label">Discount</p>
      {bill.discountPaise > 0 ? (
        <p className="muted small">
          {formatRupees(bill.discountPaise)}
          {bill.discountReason
            ? ` · ${REASON_LABEL[bill.discountReason as DiscountReason] ?? bill.discountReason}`
            : ""}
          {bill.discountApprovedBy ? " · approved" : " · waiting for doctor approval"}
        </p>
      ) : null}
      {pending && isDoctor ? (
        <button type="button" className="btn" disabled={busy} onClick={() => void approve()}>
          Approve discount
        </button>
      ) : null}
      <div className="row wrap gap-sm">
        <label className="stack gap-xs">
          <span className="muted small">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            style={{ minHeight: 44, minWidth: 100 }}
          />
        </label>
        <label className="stack gap-xs">
          <span className="muted small">Reason</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as DiscountReason)}
            style={{ minHeight: 44 }}
          >
            {DISCOUNT_REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn secondary"
          disabled={busy}
          style={{ alignSelf: "end", minHeight: 44 }}
          onClick={() => void request()}
        >
          Request discount
        </button>
      </div>
      <p className="muted small">Discounts are not advertised. Billing decision only (DCI).</p>
    </div>
  );
}

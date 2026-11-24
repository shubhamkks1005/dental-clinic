import { formatRupees, PAYMENT_MODES, type PaymentMode } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { useMe } from "../auth";
import { listPatientPayments, recordRefund, type PatientPaymentRow } from "./api";
import { Select, TextInput } from "../../ui/form";

/** 5.3.7: doctor-only refund against a payment (reason + mode required). */
export function RefundPanel({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const me = useMe();
  const [payments, setPayments] = useState<PatientPaymentRow[]>([]);
  const [paymentId, setPaymentId] = useState("");
  const [rupees, setRupees] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listPatientPayments(patientId)
      .then((rows) => {
        setPayments(rows.filter((p) => p.refundablePaise > 0));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load payments.");
      });
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (me.role !== "doctor") return null;

  async function submit() {
    const amountPaise = Math.round(Number(rupees) * 100);
    if (!paymentId) {
      setError("Pick a payment to refund.");
      return;
    }
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      setError("Enter a refund amount.");
      return;
    }
    if (reason.trim().length === 0) {
      setError("Enter a reason for the refund.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recordRefund({ paymentId, amountPaise, mode, reason: reason.trim() });
      setRupees("");
      setReason("");
      setPaymentId("");
      load();
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Refund failed.");
    } finally {
      setBusy(false);
    }
  }

  if (payments.length === 0) {
    return <p className="muted small">No refundable payments for this patient.</p>;
  }

  return (
    <div className="stack gap-sm surface card-pad">
      <p className="label">Refund (doctor)</p>
      {error ? <p className="error-text">{error}</p> : null}
      <label className="stack gap-xs">
        <span className="muted small">Payment</span>
        <Select
          value={paymentId}
          onChange={(e) => setPaymentId(e.target.value)}
          style={{ minHeight: 44 }}
        >
          <option value="">Select…</option>
          {payments.map((p) => (
            <option key={p.id} value={p.id}>
              {p.receiptNo ?? p.id.slice(0, 8)} · {p.dayLocal} · up to{" "}
              {formatRupees(p.refundablePaise)} ({p.mode})
            </option>
          ))}
        </Select>
      </label>
      <div className="row wrap gap-sm">
        <label className="stack gap-xs">
          <span className="muted small">Amount (₹)</span>
          <TextInput
            type="number"
            inputMode="decimal"
            min={0}
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            style={{ minHeight: 44, minWidth: 100 }}
          />
        </label>
        <label className="stack gap-xs">
          <span className="muted small">Mode</span>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value as PaymentMode)}
            style={{ minHeight: 44 }}
          >
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label className="stack gap-xs">
        <span className="muted small">Reason</span>
        <TextInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          style={{ minHeight: 44 }}
        />
      </label>
      <button type="button" className="btn" disabled={busy} onClick={() => void submit()}>
        Record refund
      </button>
    </div>
  );
}

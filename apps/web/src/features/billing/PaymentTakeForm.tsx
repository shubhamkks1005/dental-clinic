import { useState } from "react";
import { recordPayment } from "./api";

const MODES = ["cash", "upi", "card", "bank", "cheque", "other"] as const;

/** S09 take payment: amount, mode, optional split cash+UPI, reference. */
export function PaymentTakeForm({
  patientId,
  duePaise,
  onDone,
  onError,
}: {
  patientId: string;
  duePaise: number;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [amountRupees, setAmountRupees] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("cash");
  const [splitOn, setSplitOn] = useState(false);
  const [splitMode, setSplitMode] = useState<(typeof MODES)[number]>("upi");
  const [splitRupees, setSplitRupees] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const typedPaise = Math.round(Number(amountRupees) * 100);
  const splitPaise = Math.round(Number(splitRupees) * 100);

  async function takePayment(paise: number) {
    setSaving(true);
    onError("");
    try {
      const pay = await recordPayment({
        patientId,
        amountPaise: paise,
        mode,
        reference: reference.trim() || undefined,
        ...(splitOn && splitMode !== mode && splitPaise > 0 ? { splitMode, splitPaise } : {}),
      });
      setAmountRupees("");
      setSplitRupees("");
      setReference("");
      onDone();
      window.open(`/app/print/receipt/${encodeURIComponent(pay.id)}`, "_blank", "noopener");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setSaving(false);
    }
  }

  if (duePaise <= 0) return null;

  return (
    <div className="stack gap-sm card-pad surface">
      <p className="label">Take payment</p>
      <div className="row wrap gap-sm">
        <label className="stack gap-xs">
          <span className="muted small">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            style={{ minHeight: 44, minWidth: 120 }}
          />
        </label>
        <label className="stack gap-xs">
          <span className="muted small">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as (typeof MODES)[number])}
            style={{ minHeight: 44 }}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="stack gap-xs">
          <span className="muted small">Reference</span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={80}
            placeholder="Short ref only"
            style={{ minHeight: 44, minWidth: 140 }}
          />
        </label>
      </div>

      <label className="row gap-sm align-center" style={{ minHeight: 44 }}>
        <input type="checkbox" checked={splitOn} onChange={(e) => setSplitOn(e.target.checked)} />
        <span>Split with a second mode (e.g. cash + UPI)</span>
      </label>

      {splitOn ? (
        <div className="row wrap gap-sm">
          <label className="stack gap-xs">
            <span className="muted small">Second mode</span>
            <select
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as (typeof MODES)[number])}
              style={{ minHeight: 44 }}
            >
              {MODES.filter((m) => m !== mode).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="stack gap-xs">
            <span className="muted small">Second amount (₹)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={splitRupees}
              onChange={(e) => setSplitRupees(e.target.value)}
              style={{ minHeight: 44, minWidth: 120 }}
            />
          </label>
          {Number.isFinite(typedPaise) && typedPaise > 0 && Number.isFinite(splitPaise) ? (
            <p className="muted small" style={{ alignSelf: "end" }}>
              {mode}: ₹{((typedPaise - splitPaise) / 100).toFixed(0)} · {splitMode}: ₹
              {(splitPaise / 100).toFixed(0)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="row wrap gap-sm">
        <button
          type="button"
          className="btn"
          disabled={saving || !Number.isFinite(typedPaise) || typedPaise <= 0}
          onClick={() => void takePayment(typedPaise)}
        >
          Record payment
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={saving || duePaise <= 0}
          onClick={() => void takePayment(duePaise)}
        >
          Full balance
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={saving || duePaise <= 0}
          onClick={() => void takePayment(Math.floor(duePaise / 2))}
        >
          Half
        </button>
      </div>
      {mode === "cash" && typedPaise >= 2_00_00_000 ? (
        <p className="muted small">
          Warning: cash of ₹2,00,000 or more — check with the accountant (DRAFT).
        </p>
      ) : null}
    </div>
  );
}

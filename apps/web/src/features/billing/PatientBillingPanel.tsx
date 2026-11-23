import { formatRupees } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { listPatientBills, recordPayment, type PatientBillRow } from "./api";

const MODES = ["cash", "upi", "card", "bank", "cheque", "other"] as const;

/** S04/S17 Billing tab + S09 payment shortcuts. */
export function PatientBillingPanel({ patientId }: { patientId: string }) {
  const [bills, setBills] = useState<PatientBillRow[]>([]);
  const [due, setDue] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [amountRupees, setAmountRupees] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("cash");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listPatientBills(patientId)
      .then((r) => {
        setBills(r.bills);
        setDue(r.outstandingDuePaise);
        setAdvance(r.advancePaise);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load bills.");
      });
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function takePayment(paise: number) {
    setSaving(true);
    setError(null);
    try {
      await recordPayment({ patientId, amountPaise: paise, mode });
      setAmountRupees("");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setSaving(false);
    }
  }

  const typedPaise = Math.round(Number(amountRupees) * 100);

  return (
    <section className="stack gap-md" aria-label="Billing">
      <header className="row wrap gap-sm align-center">
        <h2 className="title-sm">Account</h2>
        <p className="muted">
          Outstanding: <strong>{formatRupees(due)}</strong>
          {advance > 0 ? (
            <>
              {" "}
              · Advance: <strong>{formatRupees(advance)}</strong>
            </>
          ) : null}
        </p>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      {due > 0 ? (
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
          </div>
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
              disabled={saving || due <= 0}
              onClick={() => void takePayment(due)}
            >
              Full balance
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={saving || due <= 0}
              onClick={() => void takePayment(Math.floor(due / 2))}
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
      ) : null}

      {bills.length === 0 ? (
        <p className="muted">No bills yet. Create one from a visit.</p>
      ) : (
        <ul className="stack gap-sm list-plain">
          {bills.map((b) => (
            <li key={b.id} className="surface card-pad row wrap gap-sm space-between">
              <div className="stack gap-xs">
                <Link to={`/app/bills/${b.id}`}>{b.billNo ?? "Draft bill"}</Link>
                <span className="muted small">
                  {b.billOn} · {b.status}
                  {b.kind === "opening_balance" ? " · opening" : ""}
                </span>
              </div>
              <div className="stack gap-xs end">
                <span>{formatRupees(b.totalPaise)}</span>
                {b.duePaise > 0 ? (
                  <span className="muted small">Due {formatRupees(b.duePaise)}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

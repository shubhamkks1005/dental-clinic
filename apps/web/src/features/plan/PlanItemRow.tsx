import { formatRupees, planPhaseLabel, type PlanItemStatus } from "@clinic/shared";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { StatusBadge } from "../../ui/StatusBadge";
import { changePlanEstimate, setPlanDecision, type PlanItem } from "./api";

type Props = {
  item: PlanItem;
  canEdit: boolean;
  onChanged: () => void;
};

const DECISIONS: Array<"planned" | "accepted" | "declined" | "deferred" | "cancelled"> = [
  "planned",
  "accepted",
  "declined",
  "deferred",
  "cancelled",
];

/** 3.6.2 / 3.6.5: one plan row with decision + estimate change. */
export function PlanItemRow({ item, canEdit, onChanged }: Props) {
  const [toldOn, setToldOn] = useState(item.toldOn ?? "");
  const [status, setStatus] = useState(item.status);
  const [rupees, setRupees] = useState(String(Math.round(item.estimatePaise / 100)));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveDecision() {
    setBusy(true);
    setError(null);
    try {
      await setPlanDecision(item.id, {
        status: status as (typeof DECISIONS)[number],
        toldOn: toldOn || null,
        version: item.version,
      });
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Could not save the decision.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEstimate() {
    const paise = Math.round(Number(rupees) * 100);
    if (!Number.isFinite(paise) || paise < 0) {
      setError("Enter a valid estimate in rupees.");
      return;
    }
    if (paise !== item.estimatePaise && !reason.trim()) {
      setError("Enter a reason when changing the estimate.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePlanEstimate(item.id, {
        estimatePaise: paise,
        reason: reason.trim() || "Correction",
        version: item.version,
      });
      setReason("");
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Could not change the estimate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="plan-item-row">
      <div className="plan-item-main">
        <strong>{item.procedureLabel}</strong>
        {item.toothFdi != null ? <span> · tooth {item.toothFdi}</span> : null}
        <span> · Estimate {formatRupees(item.estimatePaise)}</span>
        <span className="muted small"> · {planPhaseLabel(item.phase)}</span>
        <StatusBadge tone="done" label={item.status as PlanItemStatus} />
      </div>
      <p className="muted small">
        Billed {formatRupees(item.billedPaise ?? 0)} · Paid {formatRupees(item.paidPaise ?? 0)}
        {(item.billedPaise ?? 0) > item.estimatePaise ? (
          <span className="error-text">
            {" "}
            · Billed {formatRupees((item.billedPaise ?? 0) - item.estimatePaise)} over estimate
          </span>
        ) : null}
      </p>
      {canEdit ? (
        <div className="plan-item-edit">
          <label>
            Told on
            <input type="date" value={toldOn} onChange={(e) => setToldOn(e.target.value)} />
          </label>
          <label>
            Decision
            <select value={status} onChange={(e) => setStatus(e.target.value as PlanItemStatus)}>
              {DECISIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" disabled={busy} onClick={saveDecision}>
            Save decision
          </button>
          <label>
            Estimate ₹
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Needed if estimate changes"
            />
          </label>
          <button type="button" className="btn" disabled={busy} onClick={saveEstimate}>
            Save estimate
          </button>
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </li>
  );
}

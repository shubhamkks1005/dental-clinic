import { NativeInput } from "../../ui/form";
import {
  blankLine,
  CONSULT_LABEL,
  linePaise,
  toothText,
  type Line,
  type Missing,
} from "./invoice-model";
import { VfIcon } from "./vf-icons";

type Props = {
  lines: Line[];
  readOnly: boolean;
  consultFeePaise: number;
  missing: Missing[];
  onChange: (lines: Line[]) => void;
  onAddMissing: (m: Missing) => void;
  onKeepOff: (m: Missing) => void;
};

// Invoice lines (HTML 677-718) + the "done today but not on the invoice" reminder (review Q3).
export function InvoiceLines(p: Props) {
  const set = (i: number, patch: Partial<Line>) =>
    p.onChange(p.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const hasConsult = p.lines.some((l) => l.isConsult);

  return (
    <div className="vf-lines">
      {!p.readOnly &&
        p.missing.map((m) => (
          <div key={m.id} className="vf-banner vf-banner-warning" role="status">
            <span className="vf-row">
              <VfIcon name="warning" />
              {m.label}
              {toothText(m.toothFdi)} was done today. Add it to the invoice?
            </span>
            <span className="vf-row">
              <button
                type="button"
                className="vf-btn vf-btn-small vf-btn-primary"
                onClick={() => p.onAddMissing(m)}
              >
                Add
              </button>
              <button type="button" className="vf-btn vf-btn-small" onClick={() => p.onKeepOff(m)}>
                Keep off
              </button>
            </span>
          </div>
        ))}

      {p.lines.length > 0 && (
        <div className="vf-line-head" aria-hidden="true">
          <span>Item</span>
          <span>Qty</span>
          <span>Amount (₹)</span>
          <span />
        </div>
      )}
      {p.lines.map((l, i) => (
        <div key={l.key} className="vf-line" data-line={l.label}>
          <div className="vf-line-label">
            <NativeInput
              className="vf-input"
              value={l.label}
              disabled={p.readOnly}
              aria-label="Line item label"
              maxLength={120}
              onChange={(e) => set(i, { label: e.target.value })}
            />
            {!p.readOnly && linePaise(l) === null && (
              <span className="vf-nofee">
                <VfIcon name="warning" /> No fee set
              </span>
            )}
          </div>
          <NativeInput
            className="vf-input vf-num"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={l.qty}
            disabled={p.readOnly}
            aria-label="Quantity"
            onChange={(e) =>
              set(i, { qty: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })
            }
          />
          <NativeInput
            className="vf-input vf-num vf-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={l.rupees}
            disabled={p.readOnly}
            aria-label="Amount in rupees"
            onChange={(e) => set(i, { rupees: e.target.value })}
          />
          <span className="vf-line-end">
            {!p.readOnly && (
              <button
                type="button"
                className="vf-icon-btn"
                aria-label={`Remove ${l.label}`}
                onClick={() => p.onChange(p.lines.filter((_, j) => j !== i))}
              >
                <VfIcon name="trash" />
              </button>
            )}
          </span>
        </div>
      ))}

      {p.lines.length === 0 && (
        <div className="vf-empty">
          <p>Nothing to invoice on this visit.</p>
          <p className="vf-muted">Add a consultation fee or a custom line below if needed.</p>
        </div>
      )}

      {!p.readOnly && (
        <div className="vf-row">
          <button
            type="button"
            className="vf-btn"
            onClick={() => p.onChange([...p.lines, blankLine()])}
          >
            <VfIcon name="add" /> Add line
          </button>
          <button
            type="button"
            className="vf-btn vf-btn-soft"
            onClick={() =>
              p.onChange(
                hasConsult
                  ? p.lines.filter((l) => !l.isConsult)
                  : [blankLine(CONSULT_LABEL, p.consultFeePaise, true), ...p.lines],
              )
            }
          >
            <VfIcon name="stethoscope" />{" "}
            {hasConsult ? "Remove consultation fee" : "Add consultation fee"}
          </button>
        </div>
      )}
    </div>
  );
}

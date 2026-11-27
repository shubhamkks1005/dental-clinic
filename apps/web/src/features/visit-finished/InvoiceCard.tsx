import { BILL_NOTE_MAX } from "@clinic/shared";
import { useMemo, useState } from "react";
import { Textarea } from "../../ui/form";
import type { BillDto } from "../billing/api";
import type { VisitAfterDto } from "./api";
import { InvoiceActions } from "./InvoiceActions";
import { InvoiceLines } from "./InvoiceLines";
import { blankLine, missingProcedures, toothText } from "./invoice-model";
import { MoneySummary } from "./MoneySummary";
import { useInvoice } from "./useInvoice";
import { VfIcon } from "./vf-icons";

type Props = {
  visitId: string;
  after: VisitAfterDto;
  bill: BillDto | null;
  setBill: (b: BillDto | null) => void;
  toast: (text: string) => void;
};

const BADGE: Record<string, [string, string]> = {
  draft: ["Draft", "vf-pill-warning"],
  with_reception: ["With reception", "vf-pill-info"],
  paid: ["Paid", "vf-pill-success"],
  not_billed: ["Not billed", "vf-pill-plain"],
};

// The invoice (HTML 619-840) with the owner's flow: Save, then Edit or Lock (review Q2).
export function InvoiceCard({ visitId, after, bill, setBill, toast }: Props) {
  const inv = useInvoice({ visitId, after, bill, setBill });
  const [keptOff, setKeptOff] = useState<Set<string>>(new Set());
  const readOnly = inv.mode !== "editing" || inv.locked;
  const missing = useMemo(
    () => (inv.locked ? [] : missingProcedures(after.procedures, inv.lines, keptOff)),
    [after.procedures, inv.lines, keptOff, inv.locked],
  );
  const state = !bill
    ? "not_billed"
    : !inv.locked
      ? "draft"
      : inv.money.kind === "remaining"
        ? "with_reception"
        : "paid";
  const [word, cls] = BADGE[state]!;

  return (
    <section className="vf-card vf-invoice" aria-labelledby="vf-inv-h">
      <div className="vf-inv-head">
        <div className="vf-row">
          <h2 id="vf-inv-h" className="vf-h2">
            Visit invoice
          </h2>
          <span className={`vf-pill ${cls}`}>{word}</span>
          {bill?.billNo && <span className="vf-mono">{bill.billNo}</span>}
          <SaveWord state={inv.saveState} dirty={inv.dirty && inv.mode === "editing"} />
        </div>
      </div>
      {inv.error && (
        <p className="vf-error-line" role="alert">
          <VfIcon name="error" /> {inv.error}
        </p>
      )}
      {state === "with_reception" && (
        <p className="vf-banner vf-banner-info">
          Passed to reception. Lines are locked; the note can still change.
        </p>
      )}
      {state === "paid" && (
        <p className="vf-banner vf-banner-success">
          Paid in full. This invoice is settled and locked.
        </p>
      )}
      <div className="vf-inv-grid">
        <div className="vf-col">
          {missing.length > 0 && readOnly && !inv.locked && (
            <p className="vf-banner vf-banner-warning">
              {missing.map((m) => `${m.label}${toothText(m.toothFdi)}`).join(", ")} was done today
              and is not on the invoice. Press Edit to add it.
            </p>
          )}
          <InvoiceLines
            lines={inv.lines}
            readOnly={readOnly}
            consultFeePaise={after.consultationFeePaise}
            missing={missing}
            onChange={inv.setLines}
            onAddMissing={(m) =>
              inv.setLines([
                ...inv.lines,
                { ...blankLine(m.label), toothFdi: m.toothFdi, visitProcedureId: m.id },
              ])
            }
            onKeepOff={(m) => setKeptOff(new Set([...keptOff, m.id]))}
          />
          <div className="vf-note">
            <div className="vf-money-row">
              <label htmlFor="vf-note" className="vf-strong">
                Invoice note
              </label>
              <span className="vf-mono vf-muted">
                {inv.note.length}/{BILL_NOTE_MAX}
              </span>
            </div>
            <Textarea
              id="vf-note"
              rows={2}
              maxLength={BILL_NOTE_MAX}
              value={inv.note}
              disabled={!inv.locked && readOnly}
              placeholder="e.g. Will pay the balance on Friday. No health details here."
              onChange={(e) => inv.setNote(e.target.value)}
            />
            <span className="vf-muted">No health details here. The desk can read it.</span>
            {inv.locked && bill && inv.note.trim() !== bill.notes && (
              <button
                type="button"
                className="vf-btn vf-btn-small"
                onClick={() => void inv.saveNoteOnly()}
              >
                Save note
              </button>
            )}
          </div>
        </div>
        <div className="vf-col">
          <MoneySummary inv={inv} after={after} readOnly={readOnly} />
          <InvoiceActions
            inv={inv}
            bill={bill}
            patientId={after.visit.patientId}
            missing={missing}
            onBill={setBill}
            toast={toast}
          />
        </div>
      </div>
    </section>
  );
}

function SaveWord({ state, dirty }: { state: string; dirty: boolean }) {
  if (state === "saving") return <span className="vf-muted">Saving...</span>;
  if (state === "failed") return <span className="vf-save-failed">Not saved. Try again.</span>;
  if (dirty) return <span className="vf-muted">Not saved yet</span>;
  if (state === "saved") return <span className="vf-muted">Saved</span>;
  return null;
}

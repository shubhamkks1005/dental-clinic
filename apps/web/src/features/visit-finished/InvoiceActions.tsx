import { formatRupees, PAYMENT_MODES } from "@clinic/shared";
import { useState } from "react";
import { Link } from "react-router";
import { problemText } from "../../api/problem-text";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { NativeInput, Select } from "../../ui/form";
import { useSubmitOnce } from "../../ui/submit-guard";
import { getBill, type BillDto } from "../billing/api";
import { payOnInvoice } from "./api";
import { modeWord, toothText, type Missing } from "./invoice-model";
import type { useInvoice } from "./useInvoice";
import { VfIcon } from "./vf-icons";

type After = "pass" | "print" | "download" | "pay" | "lock";
type Props = {
  inv: ReturnType<typeof useInvoice>;
  bill: BillDto | null;
  patientId: string;
  missing: Missing[];
  onBill: (b: BillDto) => void;
  toast: (text: string) => void;
};

const printUrl = (id: string, download: boolean) =>
  `/app/print/bill/${encodeURIComponent(id)}${download ? "?download=1" : ""}`;

// Footer actions of the invoice (HTML 819-836 + owner Q2): editing -> Save; saved -> Edit, Lock;
// Pass / Print / Download / Take payment on an unlocked invoice ask once, then lock first.
export function InvoiceActions({ inv, bill, patientId, missing, onBill, toast }: Props) {
  const { run, pending } = useSubmitOnce();
  const [confirm, setConfirm] = useState<After | null>(null);
  const [paying, setPaying] = useState(false);
  const passed = inv.locked;
  const paid = passed && inv.money.kind !== "remaining";

  function ask(next: After) {
    if (inv.problem) return inv.setError(inv.problem);
    if (inv.money.kind === "extra" && !inv.extra)
      return inv.setError("Choose Returned or Keep as advance.");
    if (inv.locked) return void after(next, bill!);
    setConfirm(next);
  }

  async function after(next: After, b: BillDto, tab?: Window | null) {
    if (next === "pass" || next === "lock")
      toast(next === "pass" ? "Invoice passed to reception." : "Invoice locked.");
    if (next === "print" || next === "download") {
      const url = printUrl(b.id, next === "download");
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    }
    if (next === "pay") setPaying(true);
  }

  function confirmed() {
    const next = confirm!;
    setConfirm(null);
    // Open the tab inside the click (pop-up blockers), fill it once the invoice is locked.
    const tab = next === "print" || next === "download" ? window.open("", "_blank") : null;
    void run(async () => {
      const b = await inv.lock();
      if (b) await after(next, b, tab);
      else tab?.close();
    });
  }

  return (
    <div className="vf-actions">
      {paying && bill && (
        <TakePayment
          dueDefault={inv.money.kind === "remaining" ? inv.money.amountPaise : 0}
          onCancel={() => setPaying(false)}
          onPay={async (amountPaise, mode, reference) => {
            try {
              await payOnInvoice({ patientId, billId: bill.id, amountPaise, mode, reference });
              onBill(await getBill(bill.id));
              setPaying(false);
              toast(`Payment of ${formatRupees(amountPaise)} (${modeWord(mode)}) recorded.`);
            } catch (err) {
              inv.setError(problemText(err));
            }
          }}
        />
      )}
      {bill && (
        <div className="vf-row">
          <button
            type="button"
            className="vf-btn"
            disabled={pending}
            onClick={() => ask("download")}
          >
            <VfIcon name="download" /> Download
          </button>
          <button type="button" className="vf-btn" disabled={pending} onClick={() => ask("print")}>
            <VfIcon name="print" /> Print invoice
          </button>
        </div>
      )}
      <div className="vf-actions-row">
        <div className="vf-row">
          {!paid && !paying && (
            <button
              type="button"
              className="vf-btn vf-btn-outline"
              disabled={pending}
              onClick={() => ask("pay")}
            >
              <VfIcon name="pay" /> Take payment here
            </button>
          )}
          {inv.mode === "editing" && !passed && (
            <button
              type="button"
              className="vf-btn"
              disabled={pending || inv.saveState === "saving"}
              onClick={() => void run(inv.save)}
            >
              {inv.saveState === "saving" ? "Saving..." : "Save"}
            </button>
          )}
          {inv.mode === "saved" && !passed && (
            <>
              <button type="button" className="vf-btn" onClick={inv.edit}>
                <VfIcon name="edit" /> Edit
              </button>
              <button
                type="button"
                className="vf-btn"
                disabled={pending}
                onClick={() => ask("lock")}
              >
                <VfIcon name="lock" /> Lock
              </button>
            </>
          )}
          {passed && bill && (
            <Link className="vf-btn" to={`/app/bills/${bill.id}`}>
              <VfIcon name="receipt" /> Open full invoice
            </Link>
          )}
        </div>
        <button
          type="button"
          className={`vf-btn ${passed ? "vf-btn-done" : "vf-btn-primary"}`}
          disabled={pending || passed || inv.saveState === "saving"}
          onClick={() => ask("pass")}
        >
          {passed ? <VfIcon name="check" className="vf-pop" /> : <VfIcon name="send" />}
          {inv.saveState === "saving" && !passed
            ? "Locking..."
            : passed
              ? "Passed to reception"
              : "Pass to reception"}
          <span className="vf-chip-on-primary">Invoice</span>
        </button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title="Lock this invoice?"
        message={
          "After this you cannot change the invoice." +
          (missing.length
            ? ` Not on the invoice: ${missing.map((m) => `${m.label}${toothText(m.toothFdi)}`).join(", ")}.`
            : "")
        }
        confirmLabel="Confirm"
        busy={pending}
        onConfirm={confirmed}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function TakePayment(p: {
  dueDefault: number;
  onCancel: () => void;
  onPay: (amountPaise: number, mode: string, reference: string) => Promise<void>;
}) {
  const [rupees, setRupees] = useState(p.dueDefault ? String(p.dueDefault / 100) : "");
  const [mode, setMode] = useState<string>("upi");
  const [reference, setReference] = useState("");
  const { run, pending } = useSubmitOnce();
  const amountPaise = Math.round((Number(rupees) || 0) * 100);
  const tooMuch = p.dueDefault > 0 && amountPaise > p.dueDefault;
  return (
    <div className="vf-pay">
      <div className="vf-money-row">
        <strong>Take payment here</strong>
        <button type="button" className="vf-link" onClick={p.onCancel}>
          Cancel
        </button>
      </div>
      <div className="vf-pay-grid">
        <label>
          <span className="vf-muted">Amount (₹)</span>
          <NativeInput
            className="vf-input vf-num"
            type="number"
            inputMode="decimal"
            min={1}
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
          />
        </label>
        <label>
          <span className="vf-muted">Payment mode</span>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {modeWord(m)}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="vf-muted">Reference</span>
          <NativeInput
            className="vf-input"
            maxLength={80}
            value={reference}
            placeholder="UPI ref or card last 4"
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
      </div>
      {tooMuch && (
        <p className="vf-error-line">
          More than the remaining. Record the extra as advance on the full invoice.
        </p>
      )}
      <button
        type="button"
        className="vf-btn vf-btn-primary"
        disabled={pending || amountPaise <= 0 || tooMuch}
        onClick={() => void run(() => p.onPay(amountPaise, mode, reference.trim()))}
      >
        <VfIcon name="pay" /> {pending ? "Recording..." : "Record payment"}
      </button>
    </div>
  );
}

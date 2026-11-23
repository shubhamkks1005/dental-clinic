import { useState } from "react";
import { useMe } from "../auth";
import { cancelBill, type BillDto } from "./api";

/** 5.3.8: doctor-only cancel with mandatory reason. */
export function BillCancelPanel({
  bill,
  onUpdated,
  onError,
}: {
  bill: BillDto;
  onUpdated: (bill: BillDto) => void;
  onError: (message: string) => void;
}) {
  const me = useMe();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  if (me.role !== "doctor") return null;
  if (bill.status === "cancelled") {
    return (
      <p className="muted small">Cancelled{bill.cancelReason ? `: ${bill.cancelReason}` : ""}</p>
    );
  }

  async function submit() {
    if (reason.trim().length === 0) {
      onError("Enter a reason to cancel this bill.");
      return;
    }
    setBusy(true);
    try {
      onUpdated(await cancelBill(bill.id, bill.version, reason.trim()));
      setOpen(false);
      setReason("");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Could not cancel bill.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
        Cancel bill
      </button>
    );
  }

  return (
    <div className="stack gap-sm surface card-pad">
      <p className="label">Cancel bill</p>
      <p className="muted small">
        Paid bills must be refunded first. The bill number stays visible as cancelled.
      </p>
      <label className="stack gap-xs">
        <span className="muted small">Reason</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          style={{ minHeight: 44 }}
        />
      </label>
      <div className="row wrap gap-sm">
        <button type="button" className="btn" disabled={busy} onClick={() => void submit()}>
          Confirm cancel
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setReason("");
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

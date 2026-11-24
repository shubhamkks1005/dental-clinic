import { useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { getBillCancelRequest, requestBillCancel, type BillDto } from "./api";
import { TextInput } from "../../ui/form";

/**
 * Q1.9 (D4): the desk cannot cancel an issued bill. She asks the doctor, with a reason; the doctor
 * sees it on this bill and under "Waiting for you" on Today.
 */
export function BillCancelRequestPanel({ bill }: { bill: BillDto }) {
  const me = useMe();
  const [request, setRequest] = useState<{ id: string; reason: string } | null | undefined>(
    undefined,
  );
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill.status !== "issued") return;
    getBillCancelRequest(bill.id)
      .then(setRequest)
      .catch(() => setRequest(null));
  }, [bill.id, bill.status]);

  if (bill.status !== "issued" || request === undefined) return null;
  const isDoctor = me.role === "doctor";

  if (request) {
    return (
      <p className="notice notice-warning" role="status">
        {isDoctor
          ? "Reception asks to cancel this bill: "
          : "You asked the doctor to cancel this bill: "}
        {request.reason}
      </p>
    );
  }
  if (isDoctor) return null;

  async function send() {
    if (!reason.trim()) {
      setError("Say why this bill is wrong.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestBillCancel(bill.id, reason.trim());
      setRequest({ id: "new", reason: reason.trim() });
    } catch (e: unknown) {
      setError(problemText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
        Ask the doctor to cancel
      </button>
    );
  }
  return (
    <div className="stack gap-sm surface card-pad">
      <p className="label">Ask the doctor to cancel this bill</p>
      <p className="muted small">
        Only the doctor can cancel a bill. The doctor will see your reason.
      </p>
      <label className="stack gap-xs">
        <span className="muted small">Why is it wrong?</span>
        <TextInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          style={{ minHeight: 44 }}
        />
      </label>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row wrap gap-sm">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void send()}
        >
          Send request
        </button>
        <button
          type="button"
          className="btn secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

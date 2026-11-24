import { Dialog } from "../../../ui/Dialog";
import type { ConfirmState } from "./useDoctorActions";
import type { DoctorRow } from "./doctor-model";

/** The design's confirm dialog (Skip, Pull forward, Start out of order). */
export function ConfirmSheet({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  return (
    <Dialog
      open={state !== null}
      onClose={onClose}
      title={state?.title ?? "Confirm action"}
      role="alertdialog"
    >
      <p className="td-dialog-sub">{state?.subtitle}</p>
      <p>{state?.message}</p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const run = state?.run;
            onClose();
            run?.();
          }}
        >
          {state?.proceed ?? "Confirm"}
        </button>
      </div>
    </Dialog>
  );
}

/** Late patient: the same appointment is reused, no new charge (design: late-dialog). */
export function LateSheet({
  row,
  onClose,
  onToday,
  onAnotherDay,
  onNotComing,
}: {
  row: DoctorRow | null;
  onClose: () => void;
  onToday: (row: DoctorRow) => void;
  onAnotherDay: (row: DoctorRow) => void;
  onNotComing: (row: DoctorRow) => void;
}) {
  return (
    <Dialog open={row !== null} onClose={onClose} title={`Late patient · ${row?.name ?? ""}`}>
      <p className="td-dialog-sub">
        {row?.patientCode} · Slot {row?.timeLabel}
      </p>
      <p>Same appointment is reused (no new charge). Choose the outcome:</p>
      <div className="td-late-choices">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (row) onToday(row);
            onClose();
          }}
        >
          Coming today (move back in queue)
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (row) onAnotherDay(row);
            onClose();
          }}
        >
          Another day (reschedule)
        </button>
        <button
          type="button"
          className="btn td-danger"
          onClick={() => {
            if (row) onNotComing(row);
            onClose();
          }}
        >
          Not coming (cancel)
        </button>
      </div>
    </Dialog>
  );
}

/** Start or Send in while the doctor is on break: a warning, not a block (decision 3). */
export function BreakWarning({
  row,
  back,
  onClose,
  onAnyway,
}: {
  row: DoctorRow | null;
  back: string;
  onClose: () => void;
  onAnyway: (row: DoctorRow) => void;
}) {
  return (
    <Dialog open={row !== null} onClose={onClose} title="Doctor is on break" role="alertdialog">
      <p>
        Doctor is on break, back {back}. Start {row?.name} anyway?
      </p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (row) onAnyway(row);
            onClose();
          }}
        >
          Start anyway
        </button>
      </div>
    </Dialog>
  );
}

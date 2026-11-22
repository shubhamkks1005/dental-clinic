import { Dialog } from "./Dialog";

// 1.4.6 confirm dialog (never the browser's alert/confirm). Cancel comes first, so it has the
// focus when the dialog opens: pressing Enter by habit does not do the risky thing.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} role="alertdialog">
      <p>{message}</p>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onConfirm}>
          {busy ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

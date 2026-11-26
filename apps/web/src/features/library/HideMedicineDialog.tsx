import type { ListItem } from "@clinic/shared";
import { Dialog } from "../../ui/Dialog";
import "./library-modal.css";

type Props = {
  medicine: ListItem;
  sets: ListItem[];
  onChoose: (removeFromSets: boolean) => void;
  onCancel: () => void;
};

// Q12 (2026-11-26): hiding a medicine that is in sets asks first. "Remove from sets and hide" is
// the default; "Hide only" leaves the sets as they are, and those sets stop showing in visits.
export function HideMedicineDialog({ medicine, sets, onChoose, onCancel }: Props) {
  const names = sets.map((s) => s.label).join(", ");
  return (
    <Dialog
      open
      role="alertdialog"
      title={`Hide "${medicine.label}"?`}
      onClose={onCancel}
      className="ld-modal library-doc"
    >
      <p>
        This medicine is in {sets.length} {sets.length === 1 ? "set" : "sets"}: {names}.
      </p>
      <div className="ld-modal-foot">
        <button type="button" className="ld-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="ld-btn" onClick={() => onChoose(false)}>
          Hide only (these sets stop showing in visits)
        </button>
        <button type="button" className="ld-btn-primary" autoFocus onClick={() => onChoose(true)}>
          Remove from sets and hide
        </button>
      </div>
    </Dialog>
  );
}

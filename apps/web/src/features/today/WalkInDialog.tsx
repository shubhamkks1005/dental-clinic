import type { ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { Dialog } from "../../ui/Dialog";
import { getList } from "../lists";
import { type PatientListRow } from "../patients";
import { QuickBookPatient, VisitTypeChips } from "../appointments";
import { walkInAppointment } from "./api";
import { Checkbox } from "../../ui/form";

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
};

export function WalkInDialog({ open, onClose, onDone }: Props) {
  const [patient, setPatient] = useState<PatientListRow | null>(null);
  const [visitTypes, setVisitTypes] = useState<ListItem[]>([]);
  const [visitTypeId, setVisitTypeId] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPatient(null);
    setVisitTypeId("");
    setEmergency(false);
    setError(null);
    getList("visit_types")
      .then((items) => setVisitTypes(items.filter((i) => i.active)))
      .catch(() => setVisitTypes([]));
  }, [open]);

  async function save() {
    if (!patient || !visitTypeId) return;
    setBusy(true);
    setError(null);
    try {
      await walkInAppointment({
        patientId: patient.id,
        visitTypeId,
        priority: emergency ? "emergency" : "normal",
      });
      onDone();
      onClose();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not add walk-in. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Walk-in">
      <div className="quick-book">
        <QuickBookPatient
          selected={patient}
          onSelect={setPatient}
          onClear={() => setPatient(null)}
        />
        <div>
          <p className="field-label">Visit type</p>
          <VisitTypeChips
            items={visitTypes}
            value={visitTypeId}
            onPick={setVisitTypeId}
            disabled={!patient}
          />
        </div>
        <label className="today-check">
          <Checkbox
            checked={emergency}
            onChange={(e) => setEmergency(e.target.checked)}
            disabled={!patient}
          />
          Emergency (may overbook)
        </label>
        {error ? <p className="field-error">{error}</p> : null}
        {!patient || !visitTypeId ? (
          <p className="muted small">
            {!patient ? "Choose a patient first." : "Choose a visit type."}
          </p>
        ) : null}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!patient || !visitTypeId || busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Add walk-in"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

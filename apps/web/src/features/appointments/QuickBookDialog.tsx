import { formatDisplayDate, toHhmm, type ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { Dialog } from "../../ui/Dialog";
import { getList } from "../lists";
import { getPatient, type PatientListRow } from "../patients";
import { bookAppointment, suggestSlots, type SuggestedSlot } from "./api";
import { QuickBookPatient } from "./QuickBookPatient";
import "./quick-book.css";

type Prefill = {
  dateLocal: string;
  startMin?: number;
  patientId?: string;
};

type Props = {
  open: boolean;
  prefill: Prefill;
  onClose: () => void;
  onBooked: () => void;
};

// S07 Book appointment — quick dialog (2.4.2): patient → visit type → slot → confirm.
export function QuickBookDialog({ open, prefill, onClose, onBooked }: Props) {
  const [patient, setPatient] = useState<PatientListRow | null>(null);
  const [visitTypes, setVisitTypes] = useState<ListItem[]>([]);
  const [visitTypeId, setVisitTypeId] = useState("");
  const [dateLocal, setDateLocal] = useState(prefill.dateLocal);
  const [slots, setSlots] = useState<SuggestedSlot[]>([]);
  const [slot, setSlot] = useState<SuggestedSlot | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDateLocal(prefill.dateLocal);
    setVisitTypeId("");
    setSlots([]);
    setSlot(null);
    setNote("");
    setError(null);
    setPatient(null);
    getList("visit_types")
      .then((items) => setVisitTypes(items.filter((i) => i.active)))
      .catch(() => setVisitTypes([]));
    if (prefill.patientId) {
      getPatient(prefill.patientId)
        .then((p) =>
          setPatient({
            id: p.id,
            code: p.code,
            fullName: p.fullName,
            gender: p.gender,
            ageYearsAtReg: p.ageYearsAtReg,
            dateOfBirth: p.dateOfBirth,
            createdAt: p.createdAt,
            mobile: p.mobile,
            status: p.status === "archived" ? "archived" : "active",
          }),
        )
        .catch(() => setPatient(null));
    }
  }, [open, prefill.dateLocal, prefill.patientId]);

  useEffect(() => {
    if (!open || !visitTypeId) {
      setSlots([]);
      setSlot(null);
      return;
    }
    let cancelled = false;
    suggestSlots(visitTypeId, dateLocal)
      .then((list) => {
        if (cancelled) return;
        setSlots(list);
        const preferred =
          prefill.startMin !== undefined
            ? list.find((s) => s.dateLocal === dateLocal && s.startMin === prefill.startMin)
            : undefined;
        setSlot(preferred ?? list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setSlot(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, visitTypeId, dateLocal, prefill.startMin]);

  async function confirm() {
    if (!patient || !visitTypeId || !slot) return;
    setBusy(true);
    setError(null);
    try {
      await bookAppointment({
        patientId: patient.id,
        visitTypeId,
        dateLocal: slot.dateLocal,
        startMin: slot.startMin,
        source: "phone",
        complaint: note.trim() || null,
      });
      onBooked();
      onClose();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Could not book. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canConfirm = Boolean(patient && visitTypeId && slot && !busy);

  return (
    <Dialog open={open} onClose={onClose} title="Book appointment">
      <div className="quick-book">
        <QuickBookPatient
          selected={patient}
          onSelect={setPatient}
          onClear={() => setPatient(null)}
        />

        <label>
          Visit type
          <select
            className="input"
            value={visitTypeId}
            onChange={(e) => setVisitTypeId(e.target.value)}
            disabled={!patient}
          >
            <option value="">Choose…</option>
            {visitTypes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          From date
          <input
            className="input"
            type="date"
            value={dateLocal}
            onChange={(e) => setDateLocal(e.target.value)}
            disabled={!patient}
          />
        </label>

        <fieldset className="quick-book-slots" disabled={!visitTypeId}>
          <legend>Suggested times</legend>
          {slots.length === 0 ? (
            <p className="muted small">No free slots in the next two weeks from this date.</p>
          ) : (
            <ul>
              {slots.map((s) => {
                const key = `${s.dateLocal}-${s.startMin}`;
                const active = slot?.dateLocal === s.dateLocal && slot.startMin === s.startMin;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`btn${active ? " btn-primary" : ""}`}
                      onClick={() => setSlot(s)}
                    >
                      {formatDisplayDate(s.dateLocal)} · {toHhmm(s.startMin)}–{toHhmm(s.endMin)}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <label>
          What they said on the phone
          <textarea
            className="input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Optional note"
            disabled={!patient}
          />
        </label>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canConfirm}
            onClick={() => void confirm()}
          >
            {busy ? "Booking…" : "Book"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

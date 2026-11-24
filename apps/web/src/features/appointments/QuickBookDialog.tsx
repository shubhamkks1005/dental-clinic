import { addIstDays, formatClockTime, formatDate, istDate, type ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { Dialog } from "../../ui/Dialog";
import { getList } from "../lists";
import { getPatient, type PatientListRow } from "../patients";
import { bookAppointment, rescheduleAppointment, type SuggestedSlot } from "./api";
import { noFreeTimesText, TimeChips, VisitTypeChips } from "./BookPickers";
import { DateStrip } from "./DateStrip";
import { QuickBookPatient } from "./QuickBookPatient";
import { useBookSlots } from "./useBookSlots";
import "./quick-book.css";
import { TextInput, Textarea } from "../../ui/form";

type Prefill = {
  dateLocal: string;
  startMin?: number;
  patientId?: string;
  visitTypeId?: string;
};

type Props = {
  open: boolean;
  prefill: Prefill;
  onClose: () => void;
  /** Called with the booked slot so the screen can jump to that day. */
  onBooked: (slot: SuggestedSlot) => void;
  /** Q1.4: move this appointment instead of booking a new one (same visit type and length). */
  reschedule?: { id: string; version: number };
};

// S07 Book appointment — quick dialog (2.4.2): patient → visit type → slot → confirm.
export function QuickBookDialog({ open, prefill, onClose, onBooked, reschedule }: Props) {
  const [patient, setPatient] = useState<PatientListRow | null>(null);
  const [visitTypes, setVisitTypes] = useState<ListItem[]>([]);
  const [visitTypeId, setVisitTypeId] = useState("");
  const [dateLocal, setDateLocal] = useState(prefill.dateLocal);
  const [slot, setSlot] = useState<SuggestedSlot | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDateLocal(prefill.dateLocal);
    setVisitTypeId(prefill.visitTypeId ?? "");
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
  }, [open, prefill.dateLocal, prefill.patientId, prefill.visitTypeId]);

  const { daySlots, nextSlots, loading } = useBookSlots(open, visitTypeId, dateLocal);

  // Keep the chosen time while it is still free; else the time asked for from the calendar,
  // else nothing: the desk picks, we never book a time nobody chose.
  useEffect(() => {
    setSlot((cur) => {
      const all = [...daySlots, ...nextSlots];
      const same = (x: SuggestedSlot) =>
        x.dateLocal === cur?.dateLocal && x.startMin === cur?.startMin;
      if (cur && all.some(same)) return cur;
      if (prefill.startMin !== undefined) {
        return daySlots.find((x) => x.startMin === prefill.startMin) ?? null;
      }
      return null;
    });
  }, [daySlots, nextSlots, prefill.startMin]);

  function pickNext(next: SuggestedSlot) {
    setDateLocal(next.dateLocal);
    setSlot(next);
  }

  async function confirm() {
    if (!patient || !visitTypeId || !slot) return;
    setBusy(true);
    setError(null);
    try {
      if (reschedule) {
        await rescheduleAppointment(reschedule.id, {
          version: reschedule.version,
          dateLocal: slot.dateLocal,
          startMin: slot.startMin,
        });
      } else {
        await bookAppointment({
          patientId: patient.id,
          visitTypeId,
          dateLocal: slot.dateLocal,
          startMin: slot.startMin,
          source: "phone",
          complaint: note.trim() || undefined,
        });
      }
      onBooked(slot);
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
  // Q1.6: a disabled button says why.
  const whyNot = !patient
    ? "Choose a patient first."
    : !visitTypeId
      ? "Choose a visit type."
      : !slot
        ? "Pick a time."
        : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={reschedule ? "Reschedule appointment" : "Book appointment"}
    >
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
            disabled={!patient || Boolean(reschedule)}
          />
        </div>

        <div>
          <p className="field-label">Date</p>
          <DateStrip
            days={Array.from({ length: 7 }, (_, i) => addIstDays(istDate(new Date()), i))}
            selected={dateLocal}
            onPick={setDateLocal}
            label="Next 7 days"
          />
          <label className="quick-book-more-dates">
            More dates
            <TextInput
              className="input"
              type="date"
              min={istDate(new Date())}
              value={dateLocal}
              onChange={(e) => setDateLocal(e.target.value)}
              disabled={!patient}
            />
          </label>
        </div>

        <fieldset className="quick-book-slots" disabled={!visitTypeId}>
          <legend>
            {dateLocal ? `Free times on ${formatDate(dateLocal)}` : "Pick a date to see free times"}
          </legend>
          {loading ? <p className="muted small">Looking for free times…</p> : null}
          {!loading && visitTypeId && daySlots.length === 0 ? (
            <p className="muted small">{noFreeTimesText(dateLocal, nextSlots)}</p>
          ) : null}
          <TimeChips slots={daySlots} chosen={slot} onPick={setSlot} />
          {nextSlots.length > 0 ? (
            <>
              <p className="small muted quick-book-next">Next free times</p>
              <SlotButtons slots={nextSlots} chosen={slot} onPick={pickNext} showDate />
            </>
          ) : null}
        </fieldset>

        {reschedule ? null : (
          <label>
            Note (optional)
            <Textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="What they said on the phone"
              disabled={!patient}
            />
          </label>
        )}

        {error ? <p className="field-error">{error}</p> : null}
        {whyNot ? <p className="muted small">{whyNot}</p> : null}

        <div className="dialog-actions quick-book-footer">
          {slot ? (
            <span className="small muted quick-book-summary">
              {formatDate(slot.dateLocal)}, {formatClockTime(slot.startMin)}
            </span>
          ) : null}
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canConfirm}
            onClick={() => void confirm()}
          >
            {busy ? "Saving…" : reschedule ? "Move" : "Book"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function SlotButtons({
  slots,
  chosen,
  onPick,
  showDate,
}: {
  slots: SuggestedSlot[];
  chosen: SuggestedSlot | null;
  onPick: (slot: SuggestedSlot) => void;
  showDate: boolean;
}) {
  return (
    <ul>
      {slots.map((s) => {
        const active = chosen?.dateLocal === s.dateLocal && chosen.startMin === s.startMin;
        return (
          <li key={`${s.dateLocal}-${s.startMin}`}>
            <button
              type="button"
              className={`btn${active ? " btn-primary" : ""}`}
              aria-pressed={active}
              onClick={() => onPick(s)}
            >
              {showDate ? `${formatDate(s.dateLocal)} · ` : ""}
              {formatClockTime(s.startMin)}
              {showDate ? `–${formatClockTime(s.endMin)}` : ""}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

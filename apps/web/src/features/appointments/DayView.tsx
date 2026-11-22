import {
  emptySlotStarts,
  istDate,
  istMinutes,
  snapToSlot,
  toHhmm,
  type DayWindow,
} from "@clinic/shared";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { ApiError } from "../../api/client";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { DayAppointment } from "./api";
import { rescheduleAppointment } from "./api";
import { DayCard, PX_PER_MIN } from "./DayCard";
import { DayDetails } from "./DayDetails";

type Props = {
  dateLocal: string;
  window: DayWindow;
  appointments: DayAppointment[];
  serverNow: string;
  onEmptySlot: (startMin: number) => void;
  onChanged: () => void;
};

type PendingMove = { row: DayAppointment; startMin: number };

export function DayView({
  dateLocal,
  window,
  appointments,
  serverNow,
  onEmptySlot,
  onChanged,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const nowLine = useRef<HTMLDivElement>(null);
  const dragRow = useRef<DayAppointment | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = appointments.find((a) => a.id === selectedId) ?? null;
  const busyRows = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show" && a.status !== "rescheduled",
  );
  const empties = emptySlotStarts(window, busyRows);
  const height = window.closed ? 120 : (window.dayEndMin - window.dayStartMin) * PX_PER_MIN;

  const now = new Date(serverNow);
  const showNow = !window.closed && istDate(now) === dateLocal;
  const nowMin = istMinutes(now);
  const nowTop =
    showNow && nowMin >= window.dayStartMin && nowMin <= window.dayEndMin
      ? (nowMin - window.dayStartMin) * PX_PER_MIN
      : null;

  useEffect(() => {
    nowLine.current?.scrollIntoView({ block: "center" });
  }, [dateLocal, nowTop]);

  function hourMarks(): number[] {
    if (window.closed) return [];
    const marks: number[] = [];
    for (let m = window.dayStartMin; m <= window.dayEndMin; m += 60) marks.push(m);
    return marks;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const row = dragRow.current;
    const el = scroller.current;
    dragRow.current = null;
    if (!row || !el) return;
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top + el.scrollTop;
    const raw = window.dayStartMin + y / PX_PER_MIN;
    const startMin = snapToSlot(raw, window.slotMinutes, window.dayStartMin);
    if (startMin === row.startMin) return;
    setPending({ row, startMin });
  }

  async function confirmMove() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await rescheduleAppointment(pending.row.id, {
        version: pending.row.version,
        dateLocal,
        startMin: pending.startMin,
      });
      setPending(null);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not move the appointment. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (window.closed) {
    return <p className="muted">Clinic is closed on this day.</p>;
  }

  return (
    <div className="day-view">
      <div
        className="day-timeline"
        ref={scroller}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="day-grid" style={{ height }}>
          <div className="day-hours" aria-hidden="true">
            {hourMarks().map((m) => (
              <span
                key={m}
                className="day-hour"
                style={{ top: (m - window.dayStartMin) * PX_PER_MIN }}
              >
                {toHhmm(m)}
              </span>
            ))}
          </div>
          <div className="day-track">
            {empties.map((startMin) => (
              <button
                key={startMin}
                type="button"
                className="day-empty"
                style={{
                  top: (startMin - window.dayStartMin) * PX_PER_MIN,
                  height: window.slotMinutes * PX_PER_MIN,
                }}
                aria-label={`Book at ${toHhmm(startMin)}`}
                onClick={() => onEmptySlot(startMin)}
              />
            ))}
            {appointments.map((row) => (
              <DayCard
                key={row.id}
                row={row}
                dayStartMin={window.dayStartMin}
                selected={row.id === selectedId}
                onSelect={() => setSelectedId(row.id)}
                onDragStart={() => {
                  dragRow.current = row;
                }}
              />
            ))}
            {nowTop !== null ? (
              <div ref={nowLine} className="day-now" style={{ top: nowTop }} aria-label="Now" />
            ) : null}
          </div>
        </div>
      </div>
      <DayDetails row={selected} onClose={() => setSelectedId(null)} />
      {error ? <p className="field-error">{error}</p> : null}
      <ConfirmDialog
        open={pending !== null}
        title="Move appointment?"
        message={
          pending
            ? `Move ${pending.row.patientName} to ${toHhmm(pending.startMin)} on this day?`
            : ""
        }
        confirmLabel="Move"
        busy={busy}
        onConfirm={() => void confirmMove()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

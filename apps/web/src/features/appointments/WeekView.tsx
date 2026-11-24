import { formatClockTime, formatDate, type DayWindow } from "@clinic/shared";
import { useState } from "react";
import { kindOf, KIND_LEGEND } from "./appointment-kinds";
import type { DayAppointment, DayAppointmentsReply } from "./api";
import { DayDetails } from "./DayDetails";

const PX_PER_HOUR = 56;
const GONE = ["cancelled", "no_show", "rescheduled"];

type Props = {
  days: DayAppointmentsReply[];
  today: string;
  onOpenDay: (day: string) => void;
  onChanged: () => void;
};

/** Appointments that still stand this week (cancelled and moved ones are not counted). */
export function weekBooked(days: DayAppointmentsReply[]): number {
  return days.reduce(
    (n, d) => n + d.appointments.filter((a) => !GONE.includes(a.status)).length,
    0,
  );
}

function span(days: DayAppointmentsReply[]): { start: number; end: number } {
  const open = days.filter((d) => !d.window.closed).map((d) => d.window);
  if (open.length === 0) return { start: 9 * 60, end: 18 * 60 };
  return {
    start: Math.floor(Math.min(...open.map((w: DayWindow) => w.dayStartMin)) / 60) * 60,
    end: Math.ceil(Math.max(...open.map((w: DayWindow) => w.dayEndMin)) / 60) * 60,
  };
}

// Calendar.dc.html: week grid (Mon to Sat; Sunday only when it has bookings) + the panel.
export function WeekView({ days, today, onOpenDay, onChanged }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shown = days.filter((d) => !d.window.closed || d.appointments.length > 0);
  const { start, end } = span(shown);
  const hours: number[] = [];
  for (let m = start; m < end; m += 60) hours.push(m);
  const all: DayAppointment[] = shown.flatMap((d) => d.appointments);
  const selected = all.find((a) => a.id === selectedId) ?? null;
  const height = ((end - start) / 60) * PX_PER_HOUR;

  return (
    <div className="week-view">
      <section className="week-card" aria-label="Week calendar">
        <div className="week-cols week-heads">
          <span />
          {shown.map((d) => (
            <button
              key={d.dateLocal}
              type="button"
              className={`week-head${d.dateLocal === today ? " week-head-today" : ""}`}
              onClick={() => onOpenDay(d.dateLocal)}
              aria-label={`Open ${formatDate(d.dateLocal)}`}
            >
              {formatDate(d.dateLocal).split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
        <div className="week-scroll">
          <div className="week-cols week-body" style={{ height }}>
            <div className="week-hours" aria-hidden="true">
              {hours.map((m) => (
                <span key={m} style={{ height: PX_PER_HOUR }}>
                  {formatClockTime(m)}
                </span>
              ))}
            </div>
            {shown.map((d) => (
              <div key={d.dateLocal} className="week-col">
                {d.appointments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`week-event kind-${kindOf(a.visitTypeLabel)}${GONE.includes(a.status) ? " day-card-muted" : ""}${a.id === selectedId ? " day-card-selected" : ""}`}
                    style={{
                      top: ((a.startMin - start) / 60) * PX_PER_HOUR,
                      height: Math.max(((a.endMin - a.startMin) / 60) * PX_PER_HOUR - 2, 36),
                    }}
                    aria-label={`${formatDate(d.dateLocal)} ${formatClockTime(a.startMin)} ${a.patientName}`}
                    onClick={() => setSelectedId(a.id)}
                  >
                    <strong>{a.patientName}</strong>
                    <span className="small">{a.visitTypeLabel}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="week-legend small muted">
          {KIND_LEGEND.map((k) => (
            <span key={k.key} className={`kind-${k.key}`}>
              <i aria-hidden="true" /> {k.label}
            </span>
          ))}
        </p>
      </section>
      <DayDetails row={selected} onClose={() => setSelectedId(null)} onChanged={onChanged} />
    </div>
  );
}

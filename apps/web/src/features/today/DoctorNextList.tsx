import { useState } from "react";
import { StatusBadge } from "../../ui/StatusBadge";
import type { TodayListRow } from "./buildTodayModel";

type Props = {
  next: TodayListRow[];
  rest: TodayListRow[];
  /** id of the row being opened. */
  openingId: string | null;
  onOpen: (row: TodayListRow) => void;
};

function Row({
  row,
  openingId,
  onOpen,
}: { row: TodayListRow } & Pick<Props, "openingId" | "onOpen">) {
  return (
    <li className="doctor-row">
      <span className="today-time">{row.time}</span>
      <span className="doctor-row-who">
        <span className="today-name">
          {row.name}
          {row.hasAlert || row.hasRestrictedAlert ? (
            <span className="doctor-day-alert"> · Check medical alert</span>
          ) : null}
        </span>
        <span className="small muted">{row.visit}</span>
      </span>
      <StatusBadge tone={row.tone} label={row.statusLabel} />
      <button
        type="button"
        className="btn btn-compact"
        disabled={openingId !== null}
        onClick={() => onOpen(row)}
      >
        {openingId === row.id ? "Opening…" : "Open visit"}
      </button>
    </li>
  );
}

/** "Next" (up to 3) and a "Rest of the day" fold. Every patient can still be opened. */
export function DoctorNextList({ next, rest, openingId, onOpen }: Props) {
  const [showRest, setShowRest] = useState(false);
  const waiting = next.filter((r) => r.status === "arrived").length;
  return (
    <section className="card doctor-next" aria-labelledby="doctor-next-title">
      <div className="doctor-card-head">
        <h2 id="doctor-next-title">Next</h2>
        <span className="muted small">{waiting} waiting</span>
      </div>
      {next.length === 0 ? (
        <p className="muted small doctor-empty">Nobody else is booked today.</p>
      ) : (
        <ul className="doctor-rows">
          {next.map((r) => (
            <Row key={r.id} row={r} openingId={openingId} onOpen={onOpen} />
          ))}
        </ul>
      )}
      {rest.length > 0 ? (
        <>
          <button
            type="button"
            className="doctor-rest-toggle"
            aria-expanded={showRest}
            onClick={() => setShowRest((v) => !v)}
          >
            Rest of the day ({rest.length} more) {showRest ? "‹" : "›"}
          </button>
          {showRest ? (
            <ul className="doctor-rows">
              {rest.map((r) => (
                <Row key={r.id} row={r} openingId={openingId} onOpen={onOpen} />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

import { StatusBadge } from "../../ui/StatusBadge";
import type { TodayListRow } from "./buildTodayModel";

type Props = {
  rows: TodayListRow[];
  /** id of the row being opened, so its button can say "Opening…" */
  openingId: string | null;
  onOpen: (row: TodayListRow) => void;
};

/** Doctor's whole day. Every row opens the visit: the doctor never waits for the desk. */
export function DoctorDayList({ rows, openingId, onOpen }: Props) {
  return (
    <section className="card" aria-labelledby="doctor-day-title">
      <h2 id="doctor-day-title">Today's patients</h2>
      {rows.length === 0 ? (
        <p className="muted">No appointments today.</p>
      ) : (
        <ul className="doctor-day-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="doctor-day-row"
                disabled={openingId !== null}
                onClick={() => onOpen(row)}
              >
                <span className="today-time">{row.time}</span>
                <span className="doctor-day-who">
                  <span className="today-name">
                    {row.name}
                    {row.hasAlert || row.hasRestrictedAlert ? (
                      <span className="doctor-day-alert"> · Check medical alert</span>
                    ) : null}
                  </span>
                  <span className="small muted">
                    {row.patientCode} · {row.visit}
                  </span>
                </span>
                <StatusBadge tone={row.tone} label={row.statusLabel} />
                <span className="doctor-day-go">
                  {openingId === row.id ? "Opening…" : "Open visit"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

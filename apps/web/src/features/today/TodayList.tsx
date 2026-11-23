import { formatRupees, type AppointmentStatus } from "@clinic/shared";
import { Link } from "react-router";
import { StatusBadge } from "../../ui/StatusBadge";
import { AppointmentActions } from "../appointments";
import { AlertsStrip } from "../medical-history";
import type { TodayListRow } from "./buildTodayModel";

type Props = {
  rows: TodayListRow[];
  busyId: string | null;
  onStatus: (id: string, status: AppointmentStatus, version: number) => void;
  onChanged: () => void;
};

export function TodayList({ rows, busyId, onStatus, onChanged }: Props) {
  return (
    <section className="today-list" aria-labelledby="today-list-title">
      <div className="today-list-head">
        <h2 id="today-list-title">Today's list</h2>
        <Link to="/app/appointments" className="today-link">
          Open calendar
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No appointments today. Use Walk-in or Book on the calendar.</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.id} className={`today-row${row.highlighted ? " today-row-next" : ""}`}>
              <span className="today-time">{row.time}</span>
              <span className="today-who">
                <span className="today-name">
                  {row.name}
                  {row.hasAlert ? (
                    <AlertsStrip
                      mode="icon"
                      flags={{
                        hasAlert: row.hasAlert,
                        hasRestricted: row.hasRestrictedAlert,
                      }}
                    />
                  ) : null}
                  {row.noMobile ? <span className="today-no-mobile"> No mobile</span> : null}
                  {row.priority === "emergency" ? (
                    <span className="today-emergency"> Emergency</span>
                  ) : null}
                  {row.hasDue ? (
                    <span className="small muted">
                      {" "}
                      · Due
                      {row.duePaise != null && row.duePaise > 0
                        ? ` ${formatRupees(row.duePaise)}`
                        : ""}
                    </span>
                  ) : null}
                </span>
                <span className="small muted">{row.visit}</span>
              </span>
              <StatusBadge tone={row.tone} label={row.statusLabel} />
              <span className="today-actions">
                {row.payLink ? (
                  <Link className="btn btn-primary btn-compact today-action" to={row.payLink}>
                    Take payment
                  </Link>
                ) : null}
                {row.actions
                  // Cancel, Missed and Reschedule live in the "..." menu: they need a reason or a new time.
                  .filter((a) => !["rescheduled", "cancelled", "no_show"].includes(a.status))
                  .slice(0, row.payLink ? 1 : 2)
                  .map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      className="btn btn-compact today-action"
                      disabled={busyId === row.id}
                      onClick={() => onStatus(row.id, a.status, row.version)}
                    >
                      {a.label}
                    </button>
                  ))}
                <AppointmentActions
                  row={{
                    id: row.id,
                    patientId: row.patientId,
                    patientName: row.name,
                    visitTypeId: row.visitTypeId,
                    status: row.status,
                    version: row.version,
                    startAt: row.startAt,
                    updatedAt: row.updatedAt,
                  }}
                  onChanged={onChanged}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

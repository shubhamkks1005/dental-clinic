import type { AppointmentStatus } from "@clinic/shared";
import { StatusBadge } from "../../ui/StatusBadge";
import type { TodayListRow, TodayModel } from "./buildTodayModel";

type Props = {
  model: TodayModel;
  busyId: string | null;
  onStatus: (id: string, status: AppointmentStatus, version: number) => void;
};

function DoctorCard({
  title,
  row,
  busyId,
  onStatus,
}: {
  title: string;
  row: TodayListRow | null;
  busyId: string | null;
  onStatus: Props["onStatus"];
}) {
  return (
    <section className="card doctor-today-card" aria-label={title}>
      <h2>{title}</h2>
      {!row ? (
        <p className="muted">None right now.</p>
      ) : (
        <>
          <p className="today-name">
            {row.time} · {row.name}
          </p>
          <p className="small muted">{row.visit}</p>
          <StatusBadge tone={row.tone} label={row.statusLabel} />
          <div className="today-actions">
            {row.actions
              .filter(
                (a) =>
                  a.status === "in_chair" || a.status === "completed" || a.status === "arrived",
              )
              .map((a) => (
                <button
                  key={a.status}
                  type="button"
                  className="btn btn-compact"
                  disabled={busyId === row.id}
                  onClick={() => onStatus(row.id, a.status, row.version)}
                >
                  {a.label}
                </button>
              ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Doctor home (2.4.3): Now + next three only. */
export function DoctorToday({ model, busyId, onStatus }: Props) {
  return (
    <div className="doctor-today">
      <DoctorCard title="Now" row={model.doctorNow} busyId={busyId} onStatus={onStatus} />
      <section className="card" aria-labelledby="doctor-next-title">
        <h2 id="doctor-next-title">Next 3</h2>
        {model.doctorNext.length === 0 ? (
          <p className="muted">No more patients lined up.</p>
        ) : (
          <ul className="doctor-next-list">
            {model.doctorNext.map((row) => (
              <li key={row.id}>
                <span className="today-time">{row.time}</span>
                <span className="today-name">{row.name}</span>
                <StatusBadge tone={row.tone} label={row.statusLabel} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

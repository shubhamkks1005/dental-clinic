import type { AppointmentStatus } from "@clinic/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { StatusBadge } from "../../ui/StatusBadge";
import { openOrReuseVisit } from "../visits/open-visit";
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
  onOpenVisit,
  opening,
}: {
  title: string;
  row: TodayListRow | null;
  busyId: string | null;
  onStatus: Props["onStatus"];
  onOpenVisit?: (row: TodayListRow) => void;
  opening?: boolean;
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
            {title === "Now" && onOpenVisit ? (
              <button
                type="button"
                className="btn btn-primary btn-compact"
                disabled={busyId === row.id || opening}
                onClick={() => onOpenVisit(row)}
              >
                {opening ? "Opening…" : "Open visit"}
              </button>
            ) : null}
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
                  disabled={busyId === row.id || opening}
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

/** Doctor home (2.4.3 / 3.5.1): Now + Open visit + next three. */
export function DoctorToday({ model, busyId, onStatus }: Props) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  async function openVisitFor(row: TodayListRow) {
    setOpening(true);
    setOpenError(null);
    try {
      const visitId = await openOrReuseVisit({
        patientId: row.patientId,
        appointmentId: row.id,
      });
      navigate(`/app/visits/${visitId}`);
    } catch (err: unknown) {
      setOpenError(
        err instanceof ApiError
          ? err.message
          : "Could not open the visit. Check the connection, then try again.",
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="doctor-today">
      {openError ? (
        <p className="notice notice-error" role="alert">
          {openError}
        </p>
      ) : null}
      <DoctorCard
        title="Now"
        row={model.doctorNow}
        busyId={busyId}
        onStatus={onStatus}
        onOpenVisit={openVisitFor}
        opening={opening}
      />
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

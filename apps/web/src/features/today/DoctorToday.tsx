import type { AppointmentStatus } from "@clinic/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { StatusBadge } from "../../ui/StatusBadge";
import { openOrReuseVisit } from "../visits/open-visit";
import { changeAppointmentStatus } from "./api";
import type { TodayListRow, TodayModel } from "./buildTodayModel";
import { DoctorDayList } from "./DoctorDayList";
import { movesToChairOnOpen } from "./statusActions";
import { IncompleteVisitsWidget } from "./IncompleteVisitsWidget";

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
            {onOpenVisit ? (
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

/** Doctor home (2.4.3 / 3.5.1): Now card, then the whole day. Any patient can be opened. */
export function DoctorToday({ model, busyId, onStatus }: Props) {
  const navigate = useNavigate();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  async function openVisitFor(row: TodayListRow) {
    setOpeningId(row.id);
    setOpenError(null);
    try {
      const visitId = await openOrReuseVisit({
        patientId: row.patientId,
        appointmentId: row.id,
      });
      if (movesToChairOnOpen(row.status)) {
        // The patient is now with the doctor. If this fails (someone else just changed it) the
        // doctor still gets the visit: the status is a note for the desk, not a gate.
        await changeAppointmentStatus(row.id, { status: "in_chair", version: row.version }).catch(
          () => undefined,
        );
      }
      navigate(`/app/visits/${visitId}`);
    } catch (err: unknown) {
      setOpenError(
        err instanceof ApiError
          ? err.message
          : "Could not open the visit. Check the connection, then try again.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="doctor-today">
      {openError ? (
        <p className="notice notice-error" role="alert">
          {openError}
        </p>
      ) : null}
      <IncompleteVisitsWidget />
      <DoctorCard
        title="Now"
        row={model.doctorNow}
        busyId={busyId}
        onStatus={onStatus}
        onOpenVisit={openVisitFor}
        opening={openingId !== null}
      />
      <DoctorDayList rows={model.doctorDay} openingId={openingId} onOpen={openVisitFor} />
    </div>
  );
}

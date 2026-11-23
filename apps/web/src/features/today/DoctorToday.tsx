import type { AppointmentStatus } from "@clinic/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { WaitingForYou } from "../billing";
import { useMe } from "../auth";
import { openOrReuseVisit } from "../visits/open-visit";
import { changeAppointmentStatus } from "./api";
import type { TodayListRow, TodayModel } from "./buildTodayModel";
import { DoctorNextList } from "./DoctorNextList";
import { DoctorNowCard } from "./DoctorNowCard";
import { movesToChairOnOpen } from "./statusActions";
import { useDoctorTodos } from "./useDoctorTodos";
import "./today-doctor.css";

type Props = {
  model: TodayModel;
  busyId: string | null;
  onStatus: (id: string, status: AppointmentStatus, version: number) => void;
};

/** Doctor home (DoctorToday.dc.html): Now, Next, Rest of the day, and Waiting for you. */
export function DoctorToday({ model, busyId, onStatus }: Props) {
  const navigate = useNavigate();
  const { permissions } = useMe();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const todos = useDoctorTodos({
    canSeeRequests: permissions.includes("requests.view"),
    exceptPatientId: model.doctorNow?.patientId,
  });

  async function openVisitFor(row: TodayListRow) {
    setOpeningId(row.id);
    setOpenError(null);
    try {
      const visitId = await openOrReuseVisit({ patientId: row.patientId, appointmentId: row.id });
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
      <div className="doctor-today-main">
        <DoctorNowCard
          row={model.doctorNow}
          busy={openingId !== null || busyId === model.doctorNow?.id}
          onOpenVisit={openVisitFor}
          onDone={(row) => onStatus(row.id, "completed", row.version)}
        />
        <DoctorNextList
          next={model.doctorNext}
          rest={model.doctorRest}
          openingId={openingId}
          onOpen={openVisitFor}
        />
      </div>
      <WaitingForYou extra={todos} />
    </div>
  );
}

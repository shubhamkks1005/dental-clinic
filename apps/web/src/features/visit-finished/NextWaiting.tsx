import { istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { problemText } from "../../api/problem-text";
import { useSubmitOnce } from "../../ui/submit-guard";
import { listDayAppointments, type DayAppointment } from "../appointments/api";
import { openOrReuseVisit } from "../visits/open-visit";
import { VfIcon } from "./vf-icons";

/** The next arrived patient of THIS doctor (handoff L8: several doctors), first by start time. */
export function nextWaiting(list: DayAppointment[], doctorId: string, patientId: string) {
  return (
    list
      .filter((a) => a.status === "arrived" && a.patientId !== patientId)
      .filter((a) => !a.doctorId || a.doctorId === doctorId)
      .sort((a, b) => a.startMin - b.startMin)[0] ?? null
  );
}

// "Next: Sunita Rao, waiting 12 min" + Open, or "No one waiting." (review Q3, brief item 17).
export function NextWaiting({ doctorId, patientId }: { doctorId: string; patientId: string }) {
  const navigate = useNavigate();
  const [next, setNext] = useState<DayAppointment | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useSubmitOnce();

  useEffect(() => {
    listDayAppointments(istDate(new Date()))
      .then((d) => setNext(nextWaiting(d.appointments, doctorId, patientId)))
      .catch(() => setNext(null));
  }, [doctorId, patientId]);

  if (next === undefined) return null;
  if (!next) return <div className="vf-card vf-next vf-muted">No one waiting.</div>;
  const waited = next.arrivedAt
    ? Math.max(0, Math.round((Date.now() - Date.parse(next.arrivedAt)) / 60000))
    : null;
  return (
    <div className="vf-card vf-next">
      <span className="vf-row">
        <VfIcon name="person" />
        <span>
          Next: <strong>{next.patientName}</strong>
          {waited !== null ? `, waiting ${waited} min` : ""}
        </span>
      </span>
      <button
        type="button"
        className="vf-btn vf-btn-small"
        disabled={pending}
        onClick={() =>
          void run(async () => {
            try {
              const id = await openOrReuseVisit({
                patientId: next.patientId,
                appointmentId: next.id,
              });
              navigate(`/app/visits/${id}`);
            } catch (err) {
              setError(problemText(err));
            }
          })
        }
      >
        Open {next.patientName}
      </button>
      {error && <p className="vf-error-line">{error}</p>}
    </div>
  );
}

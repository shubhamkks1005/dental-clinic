import { formatClockTime, pickNextAppointment } from "@clinic/shared";
import { useEffect, useState } from "react";
import { listPatientBills } from "../billing";
import { listPatientAppointments, type PatientAppointmentRow } from "../patients/api";
import { formatDate, formatMoney } from "../../ui/format";
import { scopeKey } from "../../ui/request-scope";
import { useRequestScope } from "../../ui/RequestScope";
import type { VisitRecent, VisitSummary } from "./api";
import { RecentVisitsSide } from "./RecentVisitsSide";

type Props = {
  patientId: string;
  /** The open visit, so its row shows the live status and complaint (PA-F10). */
  current: Pick<VisitSummary, "id" | "status" | "chiefComplaint">;
  recent: VisitRecent[];
};

/** Right-hand context: last visits, what the patient still owes, the next appointment. */
export function VisitContextPanel({ patientId, current, recent }: Props) {
  const scope = useRequestScope();
  const [due, setDue] = useState<number | null>(null);
  const [next, setNext] = useState<PatientAppointmentRow | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    scope
      .takeOr(scopeKey.bills(patientId), () => listPatientBills(patientId))
      .then((r) => !cancelled && setDue(r.outstandingDuePaise))
      .catch(() => !cancelled && setDue(null));
    scope
      .takeOr(scopeKey.patientAppointments(patientId), () => listPatientAppointments(patientId))
      .then((rows) => !cancelled && setNext(pickNextAppointment(rows, new Date())))
      .catch(() => !cancelled && setNext(undefined));
    return () => {
      cancelled = true;
    };
  }, [patientId, scope]);

  return (
    <>
      <RecentVisitsSide
        currentVisitId={current.id}
        visits={recent.map((r) =>
          r.id === current.id
            ? { ...r, status: current.status, chiefComplaint: current.chiefComplaint }
            : r,
        )}
      />
      <section className="card v1-balance" aria-label="Balance and next appointment">
        <div>
          <p className="v1-label">Balance due</p>
          <p className="v1-money">{due == null ? "—" : formatMoney(due)}</p>
        </div>
        <div className="v1-balance-next">
          <p className="muted small">Next appointment</p>
          <p>
            {next === undefined
              ? "—"
              : next
                ? `${formatDate(next.dateLocal)}, ${formatClockTime(next.startMin)}`
                : "None booked"}
          </p>
        </div>
      </section>
    </>
  );
}

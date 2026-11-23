import { formatClockTime, istDate } from "@clinic/shared";
import { useEffect, useState } from "react";
import { listPatientBills } from "../billing";
import { listPatientAppointments, type PatientAppointmentRow } from "../patients/api";
import { formatDate, formatMoney } from "../../ui/format";
import type { VisitRecent } from "./api";
import { RecentVisitsSide } from "./RecentVisitsSide";

type Props = { patientId: string; currentVisitId: string; recent: VisitRecent[] };

/** Right-hand context: last visits, what the patient still owes, the next appointment. */
export function VisitContextPanel({ patientId, currentVisitId, recent }: Props) {
  const [due, setDue] = useState<number | null>(null);
  const [next, setNext] = useState<PatientAppointmentRow | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    listPatientBills(patientId)
      .then((r) => !cancelled && setDue(r.outstandingDuePaise))
      .catch(() => !cancelled && setDue(null));
    listPatientAppointments(patientId)
      .then((rows) => {
        if (cancelled) return;
        const today = istDate(new Date());
        const upcoming = rows
          .filter((a) => a.dateLocal >= today && ["scheduled", "confirmed"].includes(a.status))
          .sort((a, b) => a.startAt.localeCompare(b.startAt));
        setNext(upcoming[0] ?? null);
      })
      .catch(() => !cancelled && setNext(undefined));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <>
      <RecentVisitsSide visits={recent} currentVisitId={currentVisitId} />
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

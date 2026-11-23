import { PatientNoChip } from "../../ui/PatientNoChip";
import type { TodayListRow } from "./buildTodayModel";

type Props = {
  row: TodayListRow | null;
  busy: boolean;
  onOpenVisit: (row: TodayListRow) => void;
  onDone: (row: TodayListRow) => void;
};

/** DoctorToday.dc.html: the patient in the chair (or the next one) with one big Open visit button. */
export function DoctorNowCard({ row, busy, onOpenVisit, onDone }: Props) {
  if (!row) {
    return (
      <section className="next-patient doctor-now" aria-label="Now">
        <p className="next-label small">Now</p>
        <p>Nobody is booked right now.</p>
      </section>
    );
  }
  const inChair = row.status === "in_chair";
  return (
    <section className="next-patient doctor-now" aria-label="Now">
      <p className="next-label small">{inChair ? "Now in chair" : "Up next"}</p>
      <p className="next-name doctor-now-name">{row.name}</p>
      <p className="next-meta">
        <PatientNoChip patientNo={row.patientCode} />
        <span>
          {row.visit} · {row.statusLabel}
        </span>
      </p>
      <div className="doctor-now-actions">
        <button
          type="button"
          className="btn next-send"
          disabled={busy}
          onClick={() => onOpenVisit(row)}
        >
          {busy ? "Opening…" : "Open visit"}
        </button>
        {inChair ? (
          <button
            type="button"
            className="btn doctor-now-done"
            disabled={busy}
            onClick={() => onDone(row)}
          >
            Done
          </button>
        ) : null}
      </div>
    </section>
  );
}

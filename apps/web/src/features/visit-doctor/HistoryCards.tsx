import { formatClockTime, formatDisplayDate, formatRupees } from "@clinic/shared";
import type { VisitPageData } from "./page-api";
import { fileLabel } from "./files-model";

type Props = {
  page: VisitPageData;
  onFile: (id: string) => void;
};

/** The History tab (design: "rpanel-ctx"): dues, next appointment, pending work, medicines, visits, files. */
export function HistoryCards({ page, onFile }: Props) {
  const next = page.nextAppointment;
  const meds = page.previousMedicines;
  return (
    <div className="vd-hist">
      <div className="vd-hist-two">
        <div className="vd-hist-card is-dues">
          <span className="vd-hist-label">Outstanding Dues</span>
          <strong className="vd-hist-money">{formatRupees(page.duesPaise)}</strong>
        </div>
        <div className="vd-hist-card is-next">
          <span className="vd-hist-label">Next Appointment</span>
          {next ? (
            <>
              <strong>
                {formatDisplayDate(next.dateLocal)} · {formatClockTime(next.startMin)}
              </strong>
              <span className="vd-hist-small">{next.visitTypeLabel}</span>
            </>
          ) : (
            <span className="vd-hist-small">None booked.</span>
          )}
        </div>
      </div>

      {page.openPlanItems.length > 0 && (
        <div className="vd-hist-card is-plan">
          <span className="vd-hist-title">Pending Treatment</span>
          {page.openPlanItems.map((p) => {
            const left = Math.max(0, p.sittings - p.sittingsDone);
            return (
              <div key={p.id} className="vd-hist-row">
                <span>
                  {p.toothFdi ? <strong>{p.toothFdi}:</strong> : null} {p.procedureLabel}
                  {p.sittings > 1 && ` — ${left} ${left === 1 ? "sitting" : "sittings"} remaining`}
                </span>
                <span className={`vd-hist-tag ${p.sittingsDone > 0 ? "is-warn" : ""}`}>
                  {p.sittingsDone > 0 ? "In progress" : "Planned"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {meds && (
        <div className="vd-hist-card is-plain">
          <span className="vd-hist-title">Previous Medications</span>
          <div className="vd-hist-list">
            {meds.items.map((m, i) => (
              <span key={`${m.genericName}-${i}`}>
                • <strong>{`${m.brand || m.genericName} ${m.strength}`.trim()}</strong> — {m.days}
                {meds.issuedAt ? ` (${formatDisplayDate(meds.issuedAt.slice(0, 10))})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {page.lastVisits.length > 0 && (
        <div className="vd-hist-card is-plain">
          <span className="vd-hist-title">Last Visits</span>
          {page.lastVisits.map((v) => (
            <div key={v.id} className="vd-hist-visit">
              <strong>{formatDisplayDate(v.visitDateLocal)}</strong>
              {v.chiefComplaint && <span className="vd-hist-note">{v.chiefComplaint}</span>}
              {v.examNote && <em>Note: “{v.examNote}”</em>}
            </div>
          ))}
        </div>
      )}

      {page.files.length > 0 && (
        <div className="vd-hist-card is-plain">
          <span className="vd-hist-title">Files (X-ray &amp; Photos)</span>
          <div className="vd-hist-files">
            {page.files.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className={`vd-hist-file ${i === 0 ? "is-first" : ""}`}
                onClick={() => onFile(f.id)}
              >
                <span className="vd-icon" aria-hidden="true">
                  {f.kind === "photo" ? "photo_camera" : "radiology"}
                </span>
                <span>{fileLabel(f)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

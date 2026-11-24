import { icons } from "../../../ui/icons";
import { PatientNoChip } from "../../../ui/PatientNoChip";
import type { DoctorModel } from "./doctor-model";

type Props = {
  chair: DoctorModel["chair"];
  spotlight: boolean;
  busy: boolean;
  /** Who is Next, for the empty card's hint. */
  nextName: string | null;
  onOpenVisit: () => void;
  onDone: () => void;
};

/** "In chair now": exactly one patient (docs/design/final/doctor_today.html "in-chair-card"). */
export function ChairCard({ chair, spotlight, busy, nextName, onOpenVisit, onDone }: Props) {
  const cls = `td-chair${spotlight ? " is-spotlight" : ""}${chair ? "" : " is-empty"}`;
  if (!chair) {
    return (
      <section id="td-chair" className={cls} aria-label="Current patient in chair">
        <div className="td-chair-body">
          <span className="td-eyebrow">In chair now</span>
          <h2 className="td-chair-name">No one in the chair</h2>
          <p className="td-chair-meta">
            {nextName
              ? `Press Start on ${nextName} when you are ready.`
              : "Nobody is waiting right now."}
          </p>
        </div>
      </section>
    );
  }
  return (
    <section id="td-chair" className={cls} aria-label="Current patient in chair">
      <div className="td-chair-body">
        <div className="td-chair-top">
          <span className="td-eyebrow">In chair now</span>
          <span className="td-chair-no">
            <PatientNoChip patientNo={chair.patientCode} />
          </span>
          {chair.alert ? (
            <span className="td-pill td-pill-error">
              <span className="td-ic" aria-hidden="true">
                {icons.warning}
              </span>
              {chair.alert}
            </span>
          ) : null}
        </div>
        <h2 className="td-chair-name">{chair.name}</h2>
        <p className="td-chair-meta">
          {chair.visit.split(" · ")[0]} · In chair since {chair.sinceLabel}
        </p>
      </div>
      <div className="td-chair-actions">
        <button type="button" className="td-btn td-btn-light" disabled={busy} onClick={onOpenVisit}>
          {busy ? "Opening…" : "Open visit"}
        </button>
        <button type="button" className="td-btn td-btn-ghost" disabled={busy} onClick={onDone}>
          Done
        </button>
      </div>
    </section>
  );
}

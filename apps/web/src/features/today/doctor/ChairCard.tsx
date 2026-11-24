import { icons } from "../../../ui/icons";
import { PatientNoChip } from "../../../ui/PatientNoChip";
import type { DoctorModel } from "./doctor-model";

type Props = {
  chair: DoctorModel["chair"];
  spotlight: boolean;
  busy: boolean;
  /** Who is Next, for the empty card's hint. */
  nextName: string | null;
  /** Patients finished today (for the all-done message). */
  done: number;
  /** Start the Next patient (the card's own button when the chair is free). */
  onStartNext?: () => void;
  onOpenVisit: () => void;
  onDone: () => void;
};

/** "In chair now": exactly one patient (docs/design/final/doctor_today.html "in-chair-card"). */
export function ChairCard({
  chair,
  spotlight,
  busy,
  nextName,
  done,
  onStartNext,
  onOpenVisit,
  onDone,
}: Props) {
  const cls = `td-chair${spotlight ? " is-spotlight" : ""}${chair ? "" : " is-empty"}`;
  if (!chair) {
    // Three calm states: patients are waiting (call the next one), everyone is seen, nobody yet.
    const state = nextName ? "waiting" : done > 0 ? "finished" : "quiet";
    return (
      <section id="td-chair" className={`${cls} is-${state}`} aria-label="Current patient in chair">
        <span className="td-free-badge" aria-hidden="true">
          {state === "waiting" ? <span className="td-ripple" /> : null}
          <span className={`td-free-icon${state === "finished" ? " td-draw" : ""}`}>
            {state === "finished" ? icons.taskDone : icons.chair}
          </span>
        </span>
        <div className="td-chair-body">
          <span className="td-eyebrow">In chair now</span>
          <h2 className="td-chair-name">
            {state === "waiting"
              ? "The chair is free"
              : state === "finished"
                ? "All patients seen"
                : "No one in the chair"}
          </h2>
          <p className="td-chair-meta">
            {state === "waiting"
              ? `Next up: ${nextName}. Call them in when you are ready.`
              : state === "finished"
                ? `${done} ${done === 1 ? "patient" : "patients"} seen today. Nothing left in the list.`
                : "Nobody has arrived yet. New patients will appear in the list below."}
          </p>
        </div>
        {state === "waiting" && onStartNext ? (
          <button
            type="button"
            className="td-btn is-primary td-call"
            disabled={busy}
            onClick={onStartNext}
          >
            Call {nextName}
          </button>
        ) : null}
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
